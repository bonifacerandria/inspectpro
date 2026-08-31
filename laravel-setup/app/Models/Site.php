<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Site extends Model
{
    protected $fillable = ['client_id', 'nom', 'adresse'];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function equipements()
    {
        return $this->hasMany(Equipement::class);
    }
}
