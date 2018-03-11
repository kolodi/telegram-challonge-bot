<?php

class NoSQL {
    private $basePath = "nosql";
    private $usersDirectory = "nosql/users/";
    private $tournamentsDirectory = "nosql/tournamnets/";
    private $chatsDirectory = "nosql/chats/";

    function __construct($basePath = "nosql") {
        $this->basePath = $basePath;
        $this->usersDirectory = "$basePath/users/";
        $this->tournamentsDirectory = "$basePath/tournaments/";
        $this->chatsDirectory = "$basePath/chats/";

        
    }

    public function GetUserTemplate() {
        $filePath = $this->usersDirectory . "user_template.json";
        if(file_exists($filePath)) {
            $templateJson = file_get_contents($filePath);
            return json_decode($templateJson, true);
        } 
        return null;
    }

    public function SaveUserData($userData) {
        $filePath = $this->usersDirectory . $userData["telegram_user"]["id"] . ".json";
        $jsonString = json_encode($userData, JSON_PRETTY_PRINT);
        file_put_contents($filePath, $jsonString);
    }

    public function GetUserData($id) {
       

        $filePath = $this->usersDirectory . $id . ".json";
        if(file_exists($filePath)) {
            $jsonString = file_get_contents($filePath);
            return json_decode($jsonString, true);
        }
        return null;
        
    }

    public function UpdateTelegramUserData($telegramUser) {
        $userData = $this->GetUserData($telegramUser["id"]);
        if(!$userData) {
            $userData = $this->GetUserTemplate();
            $userData["telegram_user"] = $telegramUser;
            $this->SaveUserData($userData);
        } else {
            $userData["telegram_user"] = $telegramUser;
            $this->SaveUserData($userData);
        }
        return $userData;
    }

    public function GetTournamentTemplate() {
        $filePath = $this->tournamentsDirectory . "tournament_template.json";
        if(file_exists($filePath)) {
            $templateJson = file_get_contents($filePath);
            return json_decode($templateJson, true);
        } 
        return null;
    }

    public function SaveTournamentData($tournamentData) {
        $filePath = $this->tournamentsDirectory . $tournamentData["id"] . ".json";
        $jsonString = json_encode($userData, JSON_PRETTY_PRINT);
        file_put_contents($filePath, $jsonString);
    }

    public function GenerateTournamentId() {
        return uniqid("tour_");
    }

    public function GetChatTemplate() {
        $filePath = $this->chatsDirectory . "chat_template.json";
        if(file_exists($filePath)) {
            $templateJson = file_get_contents($filePath);
            return json_decode($templateJson, true);
        } 
        return null;
    }

    public function SaveChatData($chatData) {
        $filePath = $this->chatsDirectory . $chatData["telegram_chat"]["id"] . ".json";
        $jsonString = json_encode($chatData, JSON_PRETTY_PRINT);
        file_put_contents($filePath, $jsonString);
    }
}