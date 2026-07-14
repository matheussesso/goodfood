<?php

test('the application health check returns a successful response', function () {
    // This is an API-only backend — routes/web.php deliberately 404s everything
    // except the health-check route registered in bootstrap/app.php.
    $response = $this->get('/up');

    $response->assertStatus(200);
});
