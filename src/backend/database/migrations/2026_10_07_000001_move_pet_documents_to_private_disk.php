<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    /**
     * Pet documents (exams, prescriptions) used to be stored on the public
     * disk. Move any existing file to the private `local` disk so they are
     * only reachable through the authorized download endpoint.
     */
    public function up(): void
    {
        $public = Storage::disk('public');
        $private = Storage::disk('local');

        DB::table('pet_documents')->orderBy('id')->each(function (object $document) use ($public, $private): void {
            if (! $public->exists($document->file_path)) {
                return;
            }

            $private->put($document->file_path, $public->get($document->file_path));
            $public->delete($document->file_path);
        });
    }

    /**
     * Move the files back to the public disk.
     */
    public function down(): void
    {
        $public = Storage::disk('public');
        $private = Storage::disk('local');

        DB::table('pet_documents')->orderBy('id')->each(function (object $document) use ($public, $private): void {
            if (! $private->exists($document->file_path)) {
                return;
            }

            $public->put($document->file_path, $private->get($document->file_path));
            $private->delete($document->file_path);
        });
    }
};
