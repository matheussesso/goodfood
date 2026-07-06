<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->away('https://app.devmat.com.br');
});
