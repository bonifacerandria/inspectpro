<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Extension du CHECK constraint sur photos.photographiable_type pour
 * autoriser 'reponse_controle' : nécessaire pour rattacher une photo à un
 * point de contrôle dont type_reponse = 'photo' (ex: photo de la coupure
 * constatée sur une élingue), sans avoir à créer une anomalie au préalable.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE photos DROP CONSTRAINT IF EXISTS photos_photographiable_type_check');
        DB::statement("
            ALTER TABLE photos ADD CONSTRAINT photos_photographiable_type_check
            CHECK (photographiable_type IN ('anomalie','equipement','document','photo_obligatoire','signature','reponse_controle'))
        ");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE photos DROP CONSTRAINT IF EXISTS photos_photographiable_type_check');
        DB::statement("
            ALTER TABLE photos ADD CONSTRAINT photos_photographiable_type_check
            CHECK (photographiable_type IN ('anomalie','equipement','document','photo_obligatoire','signature'))
        ");
    }
};
