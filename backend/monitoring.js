import client from "prom-client";


const register = new client.Registry();


client.collectDefaultMetrics({
    register
});


// HTTP requests
export const httpRequests = new client.Counter({
    name: "daka_http_requests_total",
    help: "Total HTTP requests",
    labelNames:[
        "method",
        "route",
        "status"
    ]
});


// Signups
export const signupCounter = new client.Counter({
    name:"daka_signups_total",
    help:"Total user registrations"
});


// Logins
export const loginCounter = new client.Counter({
    name:"daka_logins_total",
    help:"Total user logins"
});


// Failed logins
export const failedLoginCounter = new client.Counter({
    name:"daka_failed_logins_total",
    help:"Failed login attempts"
});


// Active users
export const activeUsers = new client.Gauge({
    name:"daka_active_users",
    help:"Active users"
});


register.registerMetric(httpRequests);
register.registerMetric(signupCounter);
register.registerMetric(loginCounter);
register.registerMetric(failedLoginCounter);
register.registerMetric(activeUsers);


export default register;
