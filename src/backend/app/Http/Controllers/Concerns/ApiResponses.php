<?php

declare(strict_types=1);

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\JsonResponse;

/**
 * Standardizes the API JSON response contract:
 * { "success": bool, "message": string, "data": mixed, "errors"?: object }.
 */
trait ApiResponses
{
    /**
     * Build a successful JSON response.
     *
     * @param  mixed   $data     Payload to return under the "data" key.
     * @param  string  $message  Human-readable status message.
     * @param  int     $status   HTTP status code.
     * @return JsonResponse
     */
    protected function respondSuccess(mixed $data = null, string $message = 'OK', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $status);
    }

    /**
     * Build an error JSON response.
     *
     * @param  string                            $message  Human-readable error message.
     * @param  int                               $status   HTTP status code.
     * @param  array<string, array<int, string>>|null  $errors  Field-level validation errors.
     * @return JsonResponse
     */
    protected function respondError(string $message, int $status, ?array $errors = null): JsonResponse
    {
        $payload = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $status);
    }
}
