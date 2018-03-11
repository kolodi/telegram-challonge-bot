<?php
include("nosql.php");

$nosql = new NoSQL("../nosql");


var_dump($nosql->GetUserTemplate());
var_dump($nosql->GetTournamentTemplate());
var_dump($nosql->GetChatTemplate());