<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhotoObligatoire extends Model
{
    public $timestamps = false;

    protected $fillable = ['type_equipement_id', 'libelle', 'ordre'];

    public function typeEquipement()
    {
        return $this->belongsTo(TypeEquipement::class, 'type_equipement_id');
    }
}
