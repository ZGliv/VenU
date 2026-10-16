// Browser contract checks using explicitly synthetic API responses.
// Real concurrency, authorization and persistence are tested by test-db.sh.
// Invoke with playwright-cli run-code --filename scripts/check-booking-ui.js.
async (page) => {
  const ctx = page.context();
  await ctx.unrouteAll();
  page.removeAllListeners("pageerror"); page.removeAllListeners("dialog");
  const origin = 'http://localhost:3107';
  const provider = '11111111-1111-4111-8111-111111111111';
  const customer = '22222222-2222-4222-8222-222222222222';
  const venueId = '33333333-3333-4333-8333-333333333333';
  const serviceId = '44444444-4444-4444-8444-444444444444';
  const venue = { id: venueId, owner_id: provider, name: 'QA ONLY — Campus tutoring', description: 'Synthetic interface-test listing', campus: 'QA campus', category: 'Academic', timezone: 'America/New_York', image_url: null, status: 'approved', services: [{ price: 25 }] };
  const service = { id: serviceId, venue_id: venueId, name: 'QA ONLY — Study session', duration: 60, price: 25 };
  let actor = customer, role = 'student', bookings = [], conflict = false, failLoad = false, schedule = [];
  let checks = 0;
  const assert = (ok, message) => { if (!ok) throw new Error(message); checks++; };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await ctx.route('https://mhnbocpozdpubjwzquha.supabase.co/**', async route => {
    const request = route.request(); const url = new URL(request.url());
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    let result = [], status = 200;
    if (url.pathname.endsWith('/auth/v1/user')) result = { id: actor, email: 'qa@example.invalid', user_metadata: {}, app_metadata: { provider: 'email' }, aud: 'authenticated', role: 'authenticated' };
    else if (url.pathname.endsWith('/rest/v1/users')) result = { id: actor, role, status: 'active', name: 'QA ONLY account', email: 'qa@example.invalid' };
    else if (url.pathname.endsWith('/rest/v1/services')) result = service;
    else if (url.pathname.endsWith('/rest/v1/venues')) {
      if (failLoad) { status = 503; result = { message: 'QA simulated connection failure' }; }
      else result = request.headers()['accept']?.includes('object') ? venue : [venue];
    } else if (url.pathname.endsWith('/rest/v1/availability')) result = schedule;
    else if (url.pathname.endsWith('/rest/v1/rpc/list_booking_slots')) {
      const body = request.postDataJSON();
      result = [{ start_time: `${body.booking_day}T14:00:00.000Z`, end_time: `${body.booking_day}T15:00:00.000Z`, available: true }, { start_time: `${body.booking_day}T14:30:00.000Z`, end_time: `${body.booking_day}T15:30:00.000Z`, available: false }];
    } else if (url.pathname.endsWith('/rest/v1/bookings')) {
      if (request.method() === 'POST') {
        if (conflict) { status = 409; result = { code: '23P01', message: 'occupied' }; }
        else {
          const body = request.postDataJSON();
          result = { ...body, id: '55555555-5555-4555-8555-555555555555', provider_id: provider, total_price: 25, status: 'pending', services: { ...service, venues: venue }, users: { name: 'QA ONLY customer', email: 'qa@example.invalid' } }; bookings = [result];
        }
      } else result = bookings;
    } else if (url.pathname.endsWith('/rest/v1/rpc/change_booking_status')) {
      const body = request.postDataJSON();
      bookings = bookings.map(booking => ({ ...booking, status: body.new_status })); result = bookings[0];
    } else if (url.pathname.endsWith('/rest/v1/rpc/save_provider_schedule')) {
      const body = request.postDataJSON(); schedule = body.days; venue.timezone = body.timezone_name; result = null;
    }
    await route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(result) });
  });
  const login = async (id, nextRole) => {
    actor = id; role = nextRole;
    const now = Math.floor(Date.now()/1000);
    const token = `${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({sub:id,aud:'authenticated',role:'authenticated',exp:now+3600,iat:now})).toString('base64url')}.QA_ONLY_NOT_A_REAL_TOKEN`;
    const session = { access_token: token, token_type:'bearer', refresh_token:'QA_ONLY', expires_in:3600, expires_at:now+3600, user:{id,email:'qa@example.invalid',aud:'authenticated',role:'authenticated',user_metadata:{},app_metadata:{provider:'email'}} };
    await ctx.clearCookies();
    await ctx.addCookies([{ name:'sb-mhnbocpozdpubjwzquha-auth-token', value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'), url:origin, sameSite:'Lax' }]);
  };
  const fit = async label => {
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${label} horizontal overflow`);
  };
  for (const width of [1440,375]) {
    await page.setViewportSize({ width, height: width===375 ? 812 : 1000 });
    await login(customer,'student');
    await page.goto(origin);
    await page.getByRole('searchbox',{name:'Search campus services'}).fill('Study');
    await page.getByRole('button',{name:'Search',exact:true}).click();
    await page.getByRole('textbox',{name:'Search providers'}).waitFor();
    assert(new URL(page.url()).searchParams.get('q')==='Study','Home search must reach Explore');
    assert(await page.getByRole('textbox',{name:'Search providers'}).inputValue()==='Study','Explore preserves search');
    await page.getByRole('textbox',{name:'Search providers'}).fill('');
    await fit(`Explore ${width}`);
    await page.screenshot({path:`output/overnight-mvp/explore-${width}.png`,fullPage:true,animations:"disabled"});
    await page.goto(`${origin}/book/${venueId}/${serviceId}`);
    await page.getByRole('heading',{name:'Request an appointment'}).waitFor();
    const tomorrow = new Date(Date.now()+86400000).toISOString().slice(0,10);
    await page.getByLabel('Appointment date').fill(tomorrow);
    const slot = page.getByRole('button',{name:/10:00 AM/}); await slot.waitFor();
    await slot.click(); await fit(`Booking ${width}`);
    await page.screenshot({path:`output/overnight-mvp/booking-${width}.png`,fullPage:true,animations:"disabled"});
    conflict = true;
    await page.getByRole('button',{name:'Request appointment',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'That time was just taken'}).waitFor(); checks++;
    assert(await page.getByRole('button',{name:'Request appointment',exact:true}).isDisabled(),'Conflict clears stale selection');
    conflict = false; await slot.click();
    await page.getByRole('button',{name:'Request appointment',exact:true}).click();
    await page.getByRole('heading',{name:'Request received',exact:true}).waitFor(); checks++;
    assert(await page.getByText('Pending provider response',{exact:true}).isVisible(),'Request is pending, not confirmed');
    await fit(`Receipt ${width}`);
    await page.getByRole('link',{name:'View My Bookings'}).click();
    await page.getByText('QA ONLY — Study session',{exact:true}).waitFor();
    await page.reload(); await page.getByText('QA ONLY — Study session',{exact:true}).waitFor(); checks++;
    await login(provider,'venue_owner');
    await page.goto(`${origin}/provider/bookings`);
    await page.getByRole('button',{name:'Confirm',exact:true}).waitFor();
    await page.getByRole('button',{name:'Confirm',exact:true}).click();
    await page.getByText('confirmed',{exact:true}).waitFor(); checks++;
    assert(await page.getByRole('button',{name:'Complete',exact:true}).isDisabled(),'Provider cannot mark future appointment complete');
    await fit(`Provider bookings ${width}`);
    await page.screenshot({path:`output/overnight-mvp/provider-${width}.png`,fullPage:true,animations:"disabled"});
    await page.goto(`${origin}/provider/availability`);
    await page.getByLabel('Provider timezone').waitFor();
    await page.getByRole('switch',{name:'Monday availability'}).click();
    await page.getByRole('button',{name:'Save Availability'}).click();
    await page.getByRole('button',{name:'Saved!'}).waitFor(); checks++;
    await page.reload(); await page.getByLabel('Provider timezone').waitFor();
    assert(await page.getByRole('switch',{name:'Monday availability'}).getAttribute('aria-checked')==='true','Saved schedule survives refetch');
    await fit(`Schedule ${width}`);
    await page.screenshot({path:`output/overnight-mvp/schedule-${width}.png`,fullPage:true,animations:"disabled"});
    schedule = [];
    await login(customer,'student');
    await page.goto(`${origin}/dashboard/bookings`);
    await page.getByText('Confirmed',{exact:true}).waitFor(); checks++;
    page.once('dialog', dialog=>dialog.accept());
    await page.getByRole('button',{name:'Cancel',exact:true}).click();
    await page.getByText('Cancelled',{exact:true}).waitFor(); checks++;
  }
  failLoad = true;
  await page.goto(`${origin}/explore`);
  await page.getByRole('button',{name:'Retry providers'}).waitFor(); checks++;
  failLoad = false;
  await page.getByRole('button',{name:'Retry providers'}).click();
  await page.getByRole('link').filter({hasText:venue.name}).first().waitFor(); checks++;
  assert(errors.length===0,`Browser errors: ${errors.join('; ')}`);
  return {checks,viewports:[375,1440],kind:'synthetic API contract/browser UI checks; see separate real PostgreSQL checks',errors};
}
