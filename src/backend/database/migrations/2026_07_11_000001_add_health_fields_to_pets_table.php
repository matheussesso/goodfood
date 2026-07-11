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
        Schema::table('pets', function (Blueprint $table) {
            $table->string('sex')->nullable()->after('type'); // male, female
            $table->boolean('neutered')->nullable()->after('special_needs');
            $table->string('microchip_number')->nullable()->after('neutered');
            $table->string('vet_name')->nullable()->after('microchip_number');
            $table->string('vet_phone')->nullable()->after('vet_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->dropColumn(['sex', 'neutered', 'microchip_number', 'vet_name', 'vet_phone']);
        });
    }
};
