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
        Schema::create('general_settings', function (Blueprint $table) {
            $table->id();

            // Custo Insumos
            $table->decimal('ingredient_cost_days_division', 10, 2)->default(30);

            // Repasse Produção
            $table->decimal('production_fixed_value', 10, 2)->default(0);
            $table->decimal('production_days_division', 10, 2)->default(1);
            $table->decimal('production_weight_multiplier', 10, 3)->default(1.000);

            // Repasse Logística
            $table->decimal('logistics_fixed_multiplier', 10, 3)->default(1.000);

            // Margem Reserva
            $table->decimal('reserve_margin_fixed_value', 10, 2)->default(0);
            $table->decimal('reserve_margin_transfer_multiplier', 10, 3)->default(1.000);

            // GFP+MKT
            $table->decimal('gfp_mkt_fixed_value', 10, 2)->default(0);
            $table->decimal('gfp_mkt_fixed_multiplier', 10, 3)->default(1.000);

            // Fiscal/Tributário
            $table->decimal('fiscal_fixed_multiplier', 10, 3)->default(1.000);

            // Cobrar
            $table->decimal('charge_fixed_value', 10, 2)->default(0);
            $table->decimal('charge_fixed_multiplier', 10, 3)->default(1.000);

            // Agenda
            $table->decimal('schedule_fixed_value', 10, 2)->default(0);
            $table->decimal('schedule_fixed_multiplier', 10, 3)->default(1.000);

            // Dificuldade
            $table->decimal('difficulty_fixed_value', 10, 2)->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('general_settings');
    }
};
