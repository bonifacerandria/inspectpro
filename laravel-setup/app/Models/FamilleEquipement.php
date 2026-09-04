<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FamilleEquipement extends Model
{
    protected $table = 'familles_equipement';

    public $timestamps = false;

    protected $fillable = ['code', 'libelle', 'ordre'];

    public function typesEquipement()
    {
        return $this->hasMany(TypeEquipement::class, 'famille_id')->orderBy('ordre');
    }
}
