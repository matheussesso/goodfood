<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ApiResponses;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

/**
 * Base controller providing authorization helpers and the standard
 * API response contract to all application controllers.
 */
abstract class Controller
{
    use ApiResponses;
    use AuthorizesRequests;
}
