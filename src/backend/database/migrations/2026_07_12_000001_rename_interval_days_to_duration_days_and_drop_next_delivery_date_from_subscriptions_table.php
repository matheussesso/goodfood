<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->renameColumn('interval_days', 'duration_days');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn('next_delivery_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->date('next_delivery_date')->nullable();
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->renameColumn('duration_days', 'interval_days');
        });
    }
};
