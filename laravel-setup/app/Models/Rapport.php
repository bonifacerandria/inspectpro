<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rapport extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'inspection_id', 'numero_rapport', 'chemin_fichier_pdf', 'genere_le', 'envoye_le',
    ];

    protected function casts(): array
    {
        return [
            'genere_le' => 'datetime',
            'envoye_le' => 'datetime',
        ];
    }

    public function inspection()
    {
        return $this->belongsTo(Inspection::class);
    }
}
