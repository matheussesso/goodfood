<?php

declare(strict_types=1);

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->command('subscriptions:generate-orders')->daily();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $isApi = fn (Request $request): bool => $request->is('api/*');

        // Centralized renderers keep every API error on the same contract:
        // { success: false, message: string, errors?: object }.
        $exceptions->render(function (ValidationException $e, Request $request) use ($isApi) {
            if (! $isApi($request)) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors'  => $e->errors(),
            ], $e->status);
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) use ($isApi) {
            if (! $isApi($request)) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        });

        $forbidden = function (Request $request) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        };

        $exceptions->render(function (AuthorizationException $e, Request $request) use ($isApi, $forbidden) {
            return $isApi($request) ? $forbidden($request) : null;
        });

        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) use ($isApi, $forbidden) {
            return $isApi($request) ? $forbidden($request) : null;
        });

        $notFound = function (Request $request) {
            return response()->json([
                'success' => false,
                'message' => 'Resource not found.',
            ], 404);
        };

        $exceptions->render(function (ModelNotFoundException $e, Request $request) use ($isApi, $notFound) {
            return $isApi($request) ? $notFound($request) : null;
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) use ($isApi, $notFound) {
            return $isApi($request) ? $notFound($request) : null;
        });
    })->create();
