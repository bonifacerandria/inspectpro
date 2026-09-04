<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TypeEquipement extends Model
{
    protected $table = 'types_equipement';

    protected $fillable = [
        'famille_id', 'code', 'libelle', 'icone', 'actif',
        'champs_identification', 'ordre',
    ];

    protected function casts(): array
    {
        return [
            'champs_identification' => 'array',
            'actif' => 'boolean',
        ];
    }

    public function famille()
    {
        return $this->belongsTo(FamilleEquipement::class, 'famille_id');
    }

    public function sections()
    {
        return $this->hasMany(SectionControle::class, 'type_equipement_id')->orderBy('ordre');
    }

    public function pointsControle()
    {
        return $this->hasMany(PointControle::class, 'type_equipement_id')
            ->where('actif', true)
            ->orderBy('ordre');
    }

    public function photosObligatoires()
    {
        return $this->hasMany(PhotoObligatoire::class, 'type_equipement_id')->orderBy('ordre');
    }

    public function documentsRequis()
    {
        return $this->hasMany(DocumentRequis::class, 'type_equipement_id')->orderBy('ordre');
    }

    public function essaisRequis()
    {
        return $this->hasMany(EssaiRequis::class, 'type_equipement_id')->orderBy('ordre');
    }

    public function equipements()
    {
        return $this->hasMany(Equipement::class, 'type_equipement_id');
    }
}
