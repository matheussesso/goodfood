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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            // pending, paid, failed, cancelled
            $table->string('status')->default('pending');
            $table->date('due_date')->nullable();
            $table->timestamp('paid_at')->nullable();
            // credit_card, pix, boleto, etc. — populated by payment gateway later
            $table->string('payment_method')->nullable();
            // external payment gateway reference / transaction id
            $table->string('reference')->nullable()->unique();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
