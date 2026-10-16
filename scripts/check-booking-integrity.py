"""Real PostgreSQL integration checks; isolated QA database only, never production.
Run after the historical migrations and booking-integrity migration are applied.
Uses psql/stdlib. Defaults to the dedicated local test port, refusing remote hosts.
"""
import os, subprocess, uuid, json, datetime, time
HOST=os.environ.get('VENU_TEST_HOST','127.0.0.1')
if HOST not in ('127.0.0.1','localhost'): raise SystemExit('Refusing non-local test database')
PORT=os.environ.get('VENU_TEST_PORT','55437')
DB=os.environ.get('VENU_TEST_DB','postgres')
BASE=['psql','-X','-h',HOST,'-p',PORT,'-d',DB,'-v','ON_ERROR_STOP=1','-At']
def raw(q): return subprocess.run(BASE,input=q,text=True,capture_output=True)
def sql(q,actor=None,expect_error=None):
    if actor: q=f"BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub','{actor}',true);\n"+q+'\nCOMMIT;'
    r=raw(q)
    if expect_error:
        assert r.returncode and expect_error.lower() in r.stderr.lower(), (expect_error,r.stdout,r.stderr)
    else: assert r.returncode==0,(r.stdout,r.stderr)
    return r.stdout.strip().splitlines()
def equal(q,expected,actor=None):
    rows=sql(q,actor); actual=rows[-2] if actor else rows[-1]
    assert actual==str(expected),(q,actual,expected)
    global checks; checks+=1
checks=0
ids={k:str(uuid.uuid4()) for k in ['owner','owner2','a','b','admin','venue','venue2','service','service2','booking','race1','race2']}
i=ids
for k in ['owner','owner2','a','b','admin']:
    sql(f"INSERT INTO auth.users(id,email) VALUES ('{i[k]}','venu-qa-{i[k]}@example.invalid');")
try:
    sql(f"UPDATE public.users SET role='venue_owner' WHERE id IN ('{i['owner']}','{i['owner2']}'); UPDATE public.users SET role='admin' WHERE id='{i['admin']}';")
    for v,s in [('venue','service'),('venue2','service2')]:
        sql(f"INSERT INTO public.venues(id,owner_id,name,campus,status,timezone) VALUES ('{i[v]}','{i['owner']}','QA ONLY - integration','QA campus','approved','America/New_York'); INSERT INTO public.services(id,venue_id,name,duration,price) VALUES ('{i[s]}','{i[v]}','QA ONLY service',60,25); INSERT INTO public.availability(venue_id,day_of_week,start_time,end_time) SELECT '{i[v]}',day,'00:00','23:59' FROM generate_series(0,6) day;")
    # Users cannot promote themselves, unsuspend themselves, or forge ownership.
    sql("UPDATE public.users SET role='admin' WHERE id=auth.uid();",i['a'],'cannot change'); checks+=1
    sql("UPDATE public.users SET status='suspended' WHERE id=auth.uid();",i['a'],'cannot change'); checks+=1
    sql(f"UPDATE public.venues SET status='approved' WHERE id='{i['venue']}';",i['owner']) # unchanged approved allowed
    sql(f"UPDATE public.venues SET status='rejected' WHERE id='{i['venue']}';",i['owner'],'administrator'); checks+=1
    sql(f"INSERT INTO public.users(id,email,role) VALUES ('{uuid.uuid4()}','fake@example.invalid','admin');",i['a'],'permission denied'); checks+=1
    equal('SELECT count(*) FROM public.users;',1,i['a'])
    sql("UPDATE public.users SET role='venue_owner' WHERE id=auth.uid();",i['a'])
    equal('SELECT role FROM public.users WHERE id=auth.uid();','venue_owner',i['a'])
    # A booking may supply tampered fields, but PostgreSQL derives them itself.
    start="(current_date+1+time '10:00') AT TIME ZONE 'America/New_York'"
    def insert(b,s='service',when=start): return f"INSERT INTO public.bookings(id,user_id,service_id,start_time,end_time,total_price) VALUES ('{i[b]}',auth.uid(),'{i[s]}',{when},({when})+interval '5 minutes',0);"
    sql(insert('booking'),i['a'])
    equal(f"SELECT total_price||'|'||(extract(epoch FROM end_time-start_time)/60)::int FROM public.bookings WHERE id='{i['booking']}';",'25.00|60',i['a'])
    equal(f"SELECT provider_id FROM public.bookings WHERE id='{i['booking']}';",i['owner'],i['a'])
    equal('SELECT count(*) FROM public.bookings;',0,i['b'])
    equal('SELECT count(*) FROM public.bookings;',1,i['admin'])
    equal('SELECT count(*) FROM public.bookings;',0,i['owner2'])
    equal(f"SELECT count(*) FROM public.users WHERE id='{i['a']}';",1,i['owner'])
    equal(f"SELECT available FROM public.list_booking_slots('{i['service2']}',current_date+1) WHERE start_time={start};",'f',i['b'])
    sql(insert('race1','service2'),i['b'],'no longer available'); checks+=1
    sql(f"UPDATE public.bookings SET total_price=1 WHERE id='{i['booking']}';",i['a'],'details are fixed'); checks+=1
    sql(f"SELECT public.change_booking_status('{i['booking']}','pending','confirmed');",i['a'],'cancel'); checks+=1
    sql(f"SELECT public.change_booking_status('{i['booking']}','pending','confirmed');",i['owner'])
    sql(f"SELECT public.change_booking_status('{i['booking']}','pending','cancelled');",i['a'],'changed'); checks+=1
    sql(f"SELECT public.change_booking_status('{i['booking']}','confirmed','completed');",i['owner'],'cannot make'); checks+=1
    sql(f"SELECT public.change_booking_status('{i['booking']}','confirmed','cancelled');",i['a'])
    equal(f"SELECT status FROM public.bookings WHERE id='{i['booking']}';",'cancelled',i['owner'])
    # Direct SQL UPDATE cannot revive a cancelled request.
    sql(f"UPDATE public.bookings SET status='pending' WHERE id='{i['booking']}';",i['owner'],'cannot make'); checks+=1
    # Atomic schedule validation rolls back the prior DELETE and timezone UPDATE.
    sql(f"SELECT public.save_provider_schedule('{i['venue']}','UTC','[{{\"day_of_week\":1,\"start_time\":\"17:00\",\"end_time\":\"09:00\"}}]');",i['owner'],'valid_time_range'); checks+=1
    equal(f"SELECT count(*) FROM public.availability WHERE venue_id='{i['venue']}';",7,i['owner'])
    equal(f"SELECT timezone FROM public.venues WHERE id='{i['venue']}';",'America/New_York',i['owner'])
    sql(f"SELECT public.save_provider_schedule('{i['venue']}','UTC','[]');",i['b'],'Only the provider'); checks+=1
    # Two transactions race for different services by the same provider. Exactly one wins.
    def concurrent(b,actor):
        q=f"BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub','{actor}',true);"+insert(b,'service' if b=='race1' else 'service2')+'SELECT pg_sleep(0.6); COMMIT;'
        p=subprocess.Popen(BASE,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True); p.stdin.write(q);p.stdin.close();return p
    p1=concurrent('race1',i['a']); time.sleep(.1); p2=concurrent('race2',i['b']);p1.wait();p2.wait()
    assert sorted([p1.returncode,p2.returncode])==[0,3],(p1.stderr.read(),p2.stderr.read());checks+=1
    equal(f"SELECT count(*) FROM public.bookings WHERE provider_id='{i['owner']}' AND status='pending';",1)
    # Adjacent appointments are allowed; a hidden competing booking cannot be altered.
    adjacent="(current_date+1+time '11:00') AT TIME ZONE 'America/New_York'"
    sql(insert('race2','service2',adjacent),i['b'])
    equal(f"SELECT count(*) FROM public.bookings WHERE provider_id='{i['owner']}' AND status='pending';",2,i['owner'])
    sql(f"SELECT public.change_booking_status('{i['race2']}','pending','confirmed');",i['owner2'],'changed'); checks+=1
    sql(f"DELETE FROM public.services WHERE id='{i['service']}';",i['owner'],'booking history'); checks+=1
    sql(f"DELETE FROM public.venues WHERE id='{i['venue']}';",i['owner'],'booking history'); checks+=1
    # Completion is available after the appointment, and only to its provider.
    sql(f"UPDATE public.bookings SET start_time=now()-interval '2 hours', end_time=now()-interval '1 hour', status='confirmed' WHERE id='{i['race2']}';")
    sql(f"SELECT public.change_booking_status('{i['race2']}','confirmed','completed');",i['owner'])
    equal(f"SELECT status FROM public.bookings WHERE id='{i['race2']}';",'completed',i['b'])
    # A day spanning the next autumn DST boundary contains both 1am instants.
    dst=sql("SELECT day::date FROM generate_series(current_date+1,current_date+30,interval '1 day') day WHERE ((day::date+time '04:00') AT TIME ZONE 'America/New_York')-((day::date+time '00:00') AT TIME ZONE 'America/New_York') = interval '5 hours';")
    if dst:
        sql(f"SELECT public.save_provider_schedule('{i['venue2']}','America/New_York','[{{\"day_of_week\":0,\"start_time\":\"00:00\",\"end_time\":\"04:00\"}}]');",i['owner'])
        equal(f"SELECT count(*) FROM public.list_booking_slots('{i['service2']}','{dst[0]}');",9,i['a'])
        equal(f"SELECT count(*) FROM public.list_booking_slots('{i['service2']}','{dst[0]}') WHERE (start_time AT TIME ZONE 'America/New_York')::time = time '01:00';",2,i['a'])
    r=raw(f"SET ROLE anon; SELECT * FROM public.list_booking_slots('{i['service']}',current_date+1);")
    assert r.returncode and 'permission denied' in r.stderr;checks+=1
    r=raw("SET ROLE anon; SELECT email FROM public.users;")
    assert r.returncode and 'permission denied' in r.stderr;checks+=1
    r=raw("SET ROLE anon; SELECT count(*) FROM public.venues WHERE status='approved';")
    assert r.returncode==0 and int(r.stdout.strip().splitlines()[-1])>=2,r.stderr;checks+=1
    # Suspension blocks further requests, not just the visible page.
    sql(f"UPDATE public.users SET status='suspended' WHERE id='{i['b']}';")
    sql(f"SELECT public.list_booking_slots('{i['service']}',current_date+1);",i['b'],'active account');checks+=1
    print(f'PASS: {checks} database checks including concurrent overlap, two-user isolation, role/approval protection, schedule rollback and provider response.')
finally:
    # Only generated QA IDs in this isolated local database are removed.
    sql(f"DELETE FROM public.bookings WHERE provider_id='{i['owner']}'; DELETE FROM auth.users WHERE id IN ({','.join(repr(i[k]) for k in ['owner','owner2','a','b','admin'])});")
