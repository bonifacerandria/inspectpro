<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SectionControle extends Model
{
    public $timestamps = false;

    protected $fillable = ['type_equipement_id', 'code', 'libelle', 'ordre'];

    public function typeEquipement()
    {
        return $this->belongsTo(TypeEquipement::class, 'type_equipement_id');
    }

    public function pointsControle()
    {
        return $this->hasMany(PointControle::class, 'section_id')->orderBy('ordre');
    }
}
