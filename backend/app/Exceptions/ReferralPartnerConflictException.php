<?php

namespace App\Exceptions;

use RuntimeException;

class ReferralPartnerConflictException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('This email already has a referral owned by a different partner.');
    }
}
