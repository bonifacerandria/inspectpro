<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipement extends Model
{
    protected $fillable = [
        'site_id', 'type_equipement_id', 'marque', 'modele', 'numero_serie',
        'numero_equipement', 'annee_fabrication', 'cmu_tonnes', 'constructeur',
        'localisation', 'champs_supplementaires', 'photo_plaque_url',
    ];

    protected function casts(): array
    {
        return [
            'champs_supplementaires' => 'array',
            'cmu_tonnes' => 'decimal:2',
        ];
    }

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function typeEquipement()
    {
        return $this->belongsTo(TypeEquipement::class, 'type_equipement_id');
    }

    public function inspections()
    {
        return $this->hasMany(Inspection::class);
    }

    public function derniereInspection()
    {
        return $this->hasOne(Inspection::class)->latestOfMany('date_inspection');
    }
}
