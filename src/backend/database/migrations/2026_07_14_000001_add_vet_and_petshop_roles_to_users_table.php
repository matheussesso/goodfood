<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Postgres has no native ENUM alter path: Laravel's schema builder emits
     * `ALTER COLUMN ... TYPE varchar(255) CHECK (...)`, but Postgres doesn't
     * accept a CHECK clause inline on ALTER COLUMN TYPE — it must be added as
     * a separate constraint. Raw statements are used for pgsql; sqlite (tests)
     * has no enum/check enforcement, so the Blueprint path there is a no-op-safe
     * fallback.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement('ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(255)');
            DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer'");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin', 'producer', 'delivery', 'vet', 'petshop'))");

            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['customer', 'admin', 'producer', 'delivery', 'vet', 'petshop'])
                ->default('customer')
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement('ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(255)');
            DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer'");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin', 'producer', 'delivery'))");

            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['customer', 'admin', 'producer', 'delivery'])
                ->default('customer')
                ->change();
        });
    }
};
