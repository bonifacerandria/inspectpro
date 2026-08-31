<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Essai extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'inspection_id', 'essai_requis_id', 'libelle', 'charge_essai_kg',
        'resultat', 'commentaire', 'created_at',
    ];

    public function inspection()
    {
        return $this->belongsTo(Inspection::class);
    }

    public function essaiRequis()
    {
        return $this->belongsTo(EssaiRequis::class, 'essai_requis_id');
    }
}
