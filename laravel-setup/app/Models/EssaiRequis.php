<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EssaiRequis extends Model
{
    protected $table = 'essais_requis';

    public $timestamps = false;

    protected $fillable = ['type_equipement_id', 'libelle', 'necessite_charge', 'ordre'];

    protected function casts(): array
    {
        return ['necessite_charge' => 'boolean'];
    }

    public function typeEquipement()
    {
        return $this->belongsTo(TypeEquipement::class, 'type_equipement_id');
    }
}
