<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\GeneralSetting;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // One settings read per request instead of one per recipe cost calculation.
        $this->app->scoped(GeneralSetting::CONTAINER_KEY, fn (): GeneralSetting => GeneralSetting::loadOrCreate());
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Central password policy consumed by Password::defaults() in validation rules.
        Password::defaults(fn (): Password => Password::min(8)->letters()->numbers());
    }
}
