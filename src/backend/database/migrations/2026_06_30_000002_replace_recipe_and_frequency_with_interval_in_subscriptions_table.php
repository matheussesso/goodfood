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
            $table->dropForeign(['recipe_id']);
            $table->dropColumn(['recipe_id', 'frequency']);
            $table->unsignedInteger('interval_days')->default(14); // days between cycles, min 14, multiple of 7
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn('interval_days');
            $table->foreignId('recipe_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('frequency')->default('weekly');
        });
    }
};
