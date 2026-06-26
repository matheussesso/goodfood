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
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('unit'); // kg, g, unit, l
            $table->decimal('unit_cost', 8, 3)->default(0);
            $table->decimal('cost_per_unit', 8, 3)->default(0); // Add cost_per_unit to match old system
            $table->decimal('loss_rate', 8, 3)->default(1.0);
            $table->decimal('difficulty_multiplier', 8, 3)->default(1.0);
            $table->string('category')->nullable();
            $table->integer('stock_quantity')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
