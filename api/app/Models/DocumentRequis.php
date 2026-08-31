<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentRequis extends Model
{
    public $timestamps = false;

    protected $fillable = ['type_equipement_id', 'libelle', 'obligatoire', 'ordre'];

    protected function casts(): array
    {
        return ['obligatoire' => 'boolean'];
    }

    public function typeEquipement()
    {
        return $this->belongsTo(TypeEquipement::class, 'type_equipement_id');
    }
}
