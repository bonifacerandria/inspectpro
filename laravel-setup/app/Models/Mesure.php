<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mesure extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'reponse_controle_id', 'valeur_nominale', 'valeur_mesuree', 'unite',
        'ecart_pourcent', 'resultat', 'created_at',
    ];

    public function reponseControle()
    {
        return $this->belongsTo(ReponseControle::class, 'reponse_controle_id');
    }
}
