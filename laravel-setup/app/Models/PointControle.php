<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PointControle extends Model
{
    protected $fillable = [
        'type_equipement_id', 'section_id', 'code', 'libelle', 'type_reponse',
        'options', 'unite_mesure', 'valeur_nominale', 'tolerance_pourcent',
        'obligatoire', 'ordre', 'actif',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'obligatoire' => 'boolean',
            'actif' => 'boolean',
            'valeur_nominale' => 'decimal:2',
            'tolerance_pourcent' => 'decimal:2',
        ];
    }

    public function typeEquipement()
    {
        return $this->belongsTo(TypeEquipement::class, 'type_equipement_id');
    }

    public function section()
    {
        return $this->belongsTo(SectionControle::class, 'section_id');
    }

    public function reponses()
    {
        return $this->hasMany(ReponseControle::class, 'point_controle_id');
    }
}
