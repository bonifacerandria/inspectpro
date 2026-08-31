<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Signature extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'inspection_id', 'type_signataire', 'nom', 'chemin_fichier', 'signe_le',
    ];

    protected function casts(): array
    {
        return ['signe_le' => 'datetime'];
    }

    public function inspection()
    {
        return $this->belongsTo(Inspection::class);
    }
}
