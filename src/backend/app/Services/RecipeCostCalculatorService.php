<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\GeneralSetting;

use App\Models\Ingredient;

class RecipeCostCalculatorService
{
    public function __construct() {}

    /**
     * Calcula o custo total de uma receita com breakdown detalhado
     *
     * @param  array  $selectedIngredients  Array com ingredient_id, quantity, unit
     * @param  int  $durationDays  Duração em dias
     * @param  int  $dailyPortions  Porções por dia
     * @return array ['estimatedCost' => float, 'costBreakdown' => array, 'debugFormula' => string]
     */
    public function calculateCost(array $selectedIngredients, int $durationDays, int $dailyPortions): array
    {
        $durationDays = max(1, $durationDays);
        $dailyPortions = max(1, $dailyPortions);

        $costBreakdown = [];
        $ingredientsCost = 0;
        $totalWeight = 0;
        $totalDifficulty = 0;

        // Calcular custo dos ingredientes + peso total + dificuldade total
        foreach ($selectedIngredients as $item) {
            if (empty($item['ingredient_id'])) {
                continue;
            }

            try {
                $ingredient = Ingredient::findOrFail($item['ingredient_id']);
                $quantity = floatval($item['quantity'] ?? 0);
                $quantityInKg = $this->convertToKg($quantity, $ingredient->unit);
                $costPerDay = ($ingredient->cost_per_unit ?? 0) * $quantityInKg * ($ingredient->loss_rate ?? 1.0);
                $totalCost = $costPerDay * $durationDays;

                $costBreakdown[] = [
                    'name' => $ingredient->name,
                    'quantity' => $quantity,
                    'unit' => $ingredient->unit,
                    'cost_per_day' => $costPerDay,
                    'total_cost' => $totalCost,
                ];

                $ingredientsCost += $totalCost;
                $totalWeight += $this->convertToKg($quantity * $durationDays, $ingredient->unit);
                $totalDifficulty += ($ingredient->difficulty_multiplier ?? 1.0);
            } catch (\Exception $e) {
                continue;
            }
        }

        // Configurações gerais
        $generalSettings = GeneralSetting::getInstance();

        // Guardar dificuldade dos ingredientes antes de adicionar valor fixo
        $difficultyFromIngredients = $totalDifficulty;

        // Adicionar valor fixo da dificuldade
        $totalDifficulty = $generalSettings->difficulty_fixed_value + $difficultyFromIngredients;

        // 1. CUSTO INSUMOS
        $ingredientCostDaysDivision = $generalSettings->ingredient_cost_days_division ?: 30;
        $ingredientCostSupplement = ($durationDays * $dailyPortions) / $ingredientCostDaysDivision;
        $custoInsumos = $ingredientsCost + $ingredientCostSupplement;

        $costBreakdown[] = [
            'name' => 'Custo de Insumos Adicional',
            'quantity' => 0,
            'unit' => '',
            'cost_per_day' => 0,
            'total_cost' => $ingredientCostSupplement,
            'is_supplement' => true,
        ];

        // 2. REPASSE PRODUÇÃO (COZINHA)
        $repasseProducao = $generalSettings->production_fixed_value
            + (($durationDays * $dailyPortions) / ($generalSettings->production_days_division ?: 1))
            + (($totalWeight * $generalSettings->production_weight_multiplier) * $totalDifficulty);

        $costBreakdown[] = [
            'name' => 'Repasse Produção (Cozinha)',
            'quantity' => 0,
            'unit' => '',
            'cost_per_day' => 0,
            'total_cost' => $repasseProducao,
            'is_supplement' => true,
        ];

        // 3. REPASSE LOGÍSTICA
        $repasseLogistica = $repasseProducao * $generalSettings->logistics_fixed_multiplier;

        $costBreakdown[] = [
            'name' => 'Repasse Logística',
            'quantity' => 0,
            'unit' => '',
            'cost_per_day' => 0,
            'total_cost' => $repasseLogistica,
            'is_supplement' => true,
        ];

        // 4. MARGEM RESERVA
        $margemReserva = $generalSettings->reserve_margin_fixed_value
            + ($repasseProducao * $generalSettings->reserve_margin_transfer_multiplier);

        $costBreakdown[] = [
            'name' => 'Margem Reserva',
            'quantity' => 0,
            'unit' => '',
            'cost_per_day' => 0,
            'total_cost' => $margemReserva,
            'is_supplement' => true,
        ];

        // 5. CUSTO GFP+MKT
        $custoGfpMkt = $generalSettings->gfp_mkt_fixed_value
            + ($repasseProducao * $generalSettings->gfp_mkt_fixed_multiplier);

        $costBreakdown[] = [
            'name' => 'Custo GFP+MKT',
            'quantity' => 0,
            'unit' => '',
            'cost_per_day' => 0,
            'total_cost' => $custoGfpMkt,
            'is_supplement' => true,
        ];

        // 6. COBRAR
        $somaCustos = $custoInsumos + $repasseProducao + $repasseLogistica + $margemReserva + $custoGfpMkt;
        $cobrar = $generalSettings->charge_fixed_value
            + ($somaCustos * $generalSettings->charge_fixed_multiplier);

        $costBreakdown[] = [
            'name' => 'Cobrar',
            'quantity' => 0,
            'unit' => '',
            'cost_per_day' => 0,
            'total_cost' => $cobrar,
            'is_supplement' => true,
        ];

        // 7. FISCAL/TRIBUTÁRIO
        $fiscalTributario = $cobrar * $generalSettings->fiscal_fixed_multiplier;

        $costBreakdown[] = [
            'name' => 'Fiscal/Tributário',
            'quantity' => 0,
            'unit' => '',
            'cost_per_day' => 0,
            'total_cost' => $fiscalTributario,
            'is_supplement' => true,
        ];

        // 8. AGENDA
        $agenda = $generalSettings->schedule_fixed_value
            + ($cobrar * $generalSettings->schedule_fixed_multiplier);

        $costBreakdown[] = [
            'name' => 'Agenda',
            'quantity' => 0,
            'unit' => '',
            'cost_per_day' => 0,
            'total_cost' => $agenda,
            'is_supplement' => true,
        ];

        // 9. RESULTADO (LUCRO MÍNIMO)
        $resultado = $cobrar - ($custoInsumos + $repasseProducao + $repasseLogistica + $margemReserva + $custoGfpMkt + $fiscalTributario + $agenda);

        $costBreakdown[] = [
            'name' => 'Resultado (Lucro Mínimo)',
            'quantity' => 0,
            'unit' => '',
            'cost_per_day' => 0,
            'total_cost' => $resultado,
            'is_supplement' => true,
        ];

        // Debug: Fórmula completa
        $debugFormula = sprintf(
            "1. CUSTO INSUMOS = %.2f (ingr) + ((%d dias × %d porc/dia) ÷ %.2f) = %.2f\n"
            ."2. REPASSE PRODUÇÃO = %.2f + ((%d × %d) ÷ %.2f) + ((%.2f × %.3f) × (%.2f + %.2f)) = %.2f\n"
            ."3. REPASSE LOGÍSTICA = %.2f × %.3f = %.2f\n"
            ."4. MARGEM RESERVA = %.2f + (%.2f × %.3f) = %.2f\n"
            ."5. CUSTO GFP+MKT = %.2f + (%.2f × %.3f) = %.2f\n"
            ."6. COBRAR = %.2f + (%.2f × %.3f) = %.2f\n"
            ."7. FISCAL/TRIBUTÁRIO = %.2f × %.3f = %.2f\n"
            ."8. AGENDA = %.2f + (%.2f × %.3f) = %.2f\n"
            .'9. RESULTADO = %.2f - %.2f = %.2f',
            $ingredientsCost, $durationDays, $dailyPortions, $ingredientCostDaysDivision, $custoInsumos,
            $generalSettings->production_fixed_value, $durationDays, $dailyPortions, $generalSettings->production_days_division ?: 1, $totalWeight, $generalSettings->production_weight_multiplier, $generalSettings->difficulty_fixed_value, $difficultyFromIngredients, $repasseProducao,
            $repasseProducao, $generalSettings->logistics_fixed_multiplier, $repasseLogistica,
            $generalSettings->reserve_margin_fixed_value, $repasseProducao, $generalSettings->reserve_margin_transfer_multiplier, $margemReserva,
            $generalSettings->gfp_mkt_fixed_value, $repasseProducao, $generalSettings->gfp_mkt_fixed_multiplier, $custoGfpMkt,
            $generalSettings->charge_fixed_value, $somaCustos, $generalSettings->charge_fixed_multiplier, $cobrar,
            $cobrar, $generalSettings->fiscal_fixed_multiplier, $fiscalTributario,
            $generalSettings->schedule_fixed_value, $cobrar, $generalSettings->schedule_fixed_multiplier, $agenda,
            $cobrar, $somaCustos + $fiscalTributario + $agenda, $resultado
        );

        // Calcular custo por kilo
        $costPerKg = $totalWeight > 0 ? round($cobrar / $totalWeight, 2) : 0;

        return [
            'estimatedCost' => round($cobrar, 2),
            'ingredientCost' => round($ingredientsCost, 2),
            'costPerKg' => $costPerKg,
            'totalWeight' => round($totalWeight, 3),
            'costBreakdown' => $costBreakdown,
            'debugFormula' => $debugFormula,
        ];
    }

    /**
     * Converte quantidade de ingrediente para kg
     *
     * @param  float  $quantity  Quantidade do ingrediente
     * @param  string  $unit  Unidade de medida
     * @return float Quantidade em kg
     */
    private function convertToKg(float $quantity, string $unit): float
    {
        return match (strtolower($unit)) {
            'kg' => $quantity,
            'g' => $quantity / 1000,
            'l' => $quantity, // 1 litro ≈ 1 kg (densidade da água)
            'ml' => $quantity / 1000,
            default => $quantity, // 'unidade' ou outros permanecem como estão
        };
    }
}
