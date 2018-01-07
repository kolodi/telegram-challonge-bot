<?php
include "telegram/lib.php";
include "challonge/challonge.class.php";

/*****************************************
 * CONFIGURATION
 *****************************************/
$telegram_token = "494619184:AAGgqciTKBa4nIs2QmpxX4ZXdqTJp8EmTdQ";
//$challonge_token = "i1Sax3ehsAUmFiq1N4gvuxElYpnqGAzCzKqAppMt"; //Jeff
$challonge_token = "iWTgKx1WNQ48AJ77JMZNSHHfiil64WA7tMCsb0oC"; //Kolodi
$commands = array(
    "/start",
    "/help",
    "/new_popup",
    "/start_popup",
    "/close",
    "/cancel_popup",
    "/join_popup",
    "/quit_popup",
    "/kick",
    "/participants",
    "/opponent",
    "/popup_results",
    "/report_score",
    "/confirm_score"
);

/*****************************************
 * VALIDATE INPUT
 *****************************************/
$telegramAPI = new TG($telegram_token);
$telegram = json_decode($telegramAPI->GetLastUpdate(), true);
if ($telegram == false)
    die("No Last Update");
if ($telegram["ok"] == false)
    die("Last Update Not OK");
if ($telegram["result"] == false || count($telegram["result"]) == 0)
    die("No result in update");
if (isset($telegram["result"][0]["message"])) {
    $telegramMessage = $telegram["result"][0]["message"];
} elseif (isset($telegram["result"][0]["edited_message"])) {
    $telegramMessage = $telegram["result"][0]["edited_message"];
} else {
    die("Unknown message");
}

$telegramText = isset($telegramMessage["text"]) ? $telegramMessage["text"] : '';
$telegramUser = $telegramMessage["from"];
$telegramUserId = $telegramUser["id"];
$telegramChatId = $telegramMessage["chat"]["id"];
$telegramMessageId = $telegramMessage['message_id'];
$isPrivateChat = $telegramMessage["chat"]["type"] == "private";
$telegramCommand = "";

if (isset($telegramMessage["entities"])) {
    foreach ($telegramMessage["entities"] as $entity) {
        if ($entity["type"] == "bot_command") {
            $telegramCommand = substr($telegramText, $entity["offset"], $entity["length"]);
            $telegramText = str_replace($telegramCommand, "", $telegramText);
            $telegramText = trim($telegramText);
        }
    }
} else if (isset($telegramMessage["reply_to_message"]) && isset($telegramMessage["reply_to_message"]["entities"])) {
    foreach ($telegramMessage["reply_to_message"]["entities"] as $entity) {
        if ($entity["type"] == "bot_command") {
            $telegramCommand = substr($telegramMessage["reply_to_message"]["text"], $entity["offset"], $entity["length"]);
        }
    }
}

$telegramCommand = str_replace("@setourbot", "", $telegramCommand);
$telegramTextLowerTrimmed = trim(strtolower($telegramText));
if (!$telegramCommand || !in_array($telegramCommand, $commands));
    //die("No command");


/*****************************************
 * RESOURCES
 *****************************************/




/*****************************************
 * DEBUG
 *****************************************/
//echo "<pre><br />\$telegramChatId => $telegramChatId";
//echo "<pre><br />";print_r($telegram);
//echo "<pre><br />\$telegramMessage => "; print_r($telegramMessage);
//echo "<pre><br />\$telegramMessageId => $telegramMessageId ";
//echo "<pre><br />\$telegramUser => "; print_r($telegramUser);
//echo "<pre><br />\$telegramText => $telegramText";
//echo "<pre><br />\$telegramCommand => $telegramCommand";
//echo "<pre><br />";print_r($challongeTournamentMapByName);    //array['lower_tournament_name' => index]
//echo "<pre><br />";print_r($challongeTournaments);            //array('index' => tournaments)
//echo "<pre><br />";print_r($challongePending);                //array('index')
//echo "<pre><br />";print_r($challongeInProgress);             //array('index')
//echo "<pre><br />";print_r($sessionData);
//die;
/*****************************************
 * Command Definition
 *****************************************/

$debugOutput = "";
switch ($telegramCommand) {
    case "/help":
        $txt = file_get_contents("popup_help.txt");
        $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt, true, 'HTML');

        break;

    case "/new_popup":
        // tournament can be created only in public room,
        // maybe even only in specific chat id of OOPS room
        if ($isPrivateChat) {
            $txt = "Popup can only be created in public chat";
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
            break;
        }

        // init challonge
        $challongeAPI = new ChallongeAPI($challonge_token);
        // get all tournaments
        // TODO: get tournamnets for only last 24 hours
        $challongeAPI->GetTournamentsJSON();

        // filter for only pending tournaments created by user
        $userPendingTournaments = $challongeAPI->FilterTournamnets(array(
            "creator" => $telegramUserId,
            "state" => "pending"
        ));

        if(count($userPendingTournaments) == 1) {
            $popupName = $userPendingTournaments[0]["name"];
            $txt = "You already have pending popup: $popupName, plese /start_popup or cancel before creating new one";
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
            break;
        }
        if(count($userPendingTournaments) > 1) {
            //This is weird case, user can not have more than 1 pending popup
            $txt = "Something gone wrong, multiple pending popups";
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
            break;
        }

        if($telegramTextLowerTrimmed == "") {
            $txt = "/new_popup, please specify popup name:";
            $debugOutput = $telegramAPI->SendPromptMessage($telegramChatId, $txt, $telegramMessageId);
            break;
        }

        // Here we have 0 pending popupos for the user, so we can proceed for creating new one

        

        $url = $telegramUserId . "_" . uniqid();
        $popupName = trim($telegramText);
        $popup_params = array(
            "tournament" => array(
                "game_name" => 'Shadow Era',
                "name" => $popupName,
                "description" => "",
                "tournament_type" => "single elimination",
                "url" => $url
            )
        );

        $challonge_response = $challongeAPI->createTournament($popup_params);
        if ($challongeAPI->hasErrors()) {
            $challongeAPI->listErrors(); //--error starting--
            $txt = "Server Error when trying to create popup";
            $debugOutput = $telegramAPI->SendReplyMessage($telegramChatId, $txt, $telegramMessageId);
            break;
        }

        // here we are free of errors

        $txt = "Popup $popupName has been created ".
            "\nplese click on /join_popup to joint it";
        $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt, true, 'HTML');

        break;

    case "/join_popup":

        // tournament can be created only in public room,
        // maybe even only in specific chat id of OOPS room
        if ($isPrivateChat) {
            $txt = "You can join a popup only in public chat";
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
            break;
        }

        // init challonge
        $challongeAPI = new ChallongeAPI($challonge_token);
        // get all tournaments
        // TODO: get tournamnets for only last 24 hours
        $challongeAPI->GetTournamentsJSON();

        // filter for only pending tournaments created by user
        $pendingTournaments = $challongeAPI->FilterTournamnets(array(
            "state" => "pending"
        ));
        if(count($pendingTournaments) == 0) {
            $txt = "There is no pending popup, you can create one using /new_popup command";
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
            break;
        }

        
        $popup = $pendingTournaments[0];
        if(count($pendingTournaments) > 1) {
            $foundByName = false;
            if($telegramTextLowerTrimmed != "") {
                $t = $challongeAPI->GetTournamentByName($telegramTextLowerTrimmed, $pendingTournaments);
                if($t)  {
                    $popup = $t;
                    $foundByName = true;
                }
            }
            if($foundByName == false) {
                $txt = "Please choose from the list of popups to join: ";
                $buttons = array();
                foreach ($pendingTournaments as $t) {
                    $buttons[] = "/join_popup " . $t["name"];
                }
                $debugOutput = $telegramAPI->SendPromptWithButtonsInColumn($telegramChatId, $txt, $telegramMessageId, $buttons);
                break;
            }
        }

        // check if user is already in participant list
        $participants = $challongeAPI->GetParticipantsJSON($popup["id"]);
        foreach($participants as $p) {
            if($p["name"] == $telegramUser['first_name']) {
                $txt = "You have already joined this popup";
                $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
                break 2;
            }
        }

        // Here we have valid $popup to join
        $challonge_response = $challongeAPI->createParticipant($popup["id"], array(
            "participant" => array(
                "name" => $telegramUser['first_name']
            )
        ));
        if ($challongeAPI->hasErrors()) {
            $txt = "Server Error";
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
        } else {
            $txt = $telegramUser['first_name'] . " joined the popup " . $popup["name"];
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
        }

        break;

    case "/participants":

        // init challonge
        $challongeAPI = new ChallongeAPI($challonge_token);
        // get all tournaments
        // TODO: get tournamnets for only last 24 hours
        $challongeAPI->GetTournamentsJSON();

        $challongeTournaments = $challongeAPI->lastTournaments;

        if(count($challongeTournaments) == 0) {
            $txt = "There is no popups, you can create one using /new_popup command";
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
            break;
        }

        $popup = $challongeTournaments[0];
        if(count($challongeTournaments) > 1) {
            $foundByName = false;
            if($telegramTextLowerTrimmed != "") {
                $t = $challongeAPI->GetTournamentByName($telegramTextLowerTrimmed);
                if($t)  {
                    $popup = $t;
                    $foundByName = true;
                }
            }
            if($foundByName == false) {
                $txt = "Please choose from the list of tournaments to display /participants: ";
                $buttons = array();
                foreach ($challongeTournaments as $t) {
                    $buttons[] = "/participants " . $t["name"];
                }
                $debugOutput = $telegramAPI->SendPromptWithButtonsInColumn($telegramChatId, $txt, $telegramMessageId, $buttons);
                break;
            }
        }

        // Here we have 1 valid popup

        $participants = $challongeAPI->GetParticipantsJSON($popup["id"]);
        if ($challongeAPI->hasErrors()) {
            $txt = "Server error";
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
            break;
        }

        if(count($participants) == 0) {
            $txt = "$telegramText has no participants at the moment";
            if($popup["state"] == "pending")
                $txt .= "\n Please /join_popup $telegramText";
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt, true, 'HTML');
        }else{
            $counter = 1;
            $txt = "$telegramText participants: ";
            foreach($participants as $participant) {
                $txt .= "\n (" . $counter . ") " . $participant['name'];
                $counter++;
            }
            if($popup["state"] == "pending")
                $txt .= "\n Please /join_popup $telegramText";
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt, true, 'HTML');
        }
        
        break;

    case "/start_popup":
        $min_participants = 4;

        // init challonge
        $challongeAPI = new ChallongeAPI($challonge_token);
        // get all tournaments
        // TODO: get tournamnets for only last 24 hours
        $challongeAPI->GetTournamentsJSON();

        // filter for only pending tournaments created by user
        $userPendingTournaments = $challongeAPI->FilterTournamnets(array(
            "creator" => $telegramUserId,
            "state" => "pending"
        ));

        if(count($userPendingTournaments) == 0) {
            $txt = "There is no popup, you can create one using /new_popup command";
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
            break;
        }
        if(count($userPendingTournaments) > 1) {
            //This is weird case, user can not have more than 1 pending popup
            $txt = "Something gone wrong, multiple pending popups";
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
            break;
        }

        // here we have exactly 1 pending popup for the user
        $popup = $userPendingTournaments[0];

        if($popup["participants_count"] < $min_participants) {
            $txt = "The popup must have at least $min_participants participants to start. Use /participants command to review.";
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
            break;
        }
        
        $participantCount = $popup["participants_count"];
        if($participantCount < 8 && $telegramTextLowerTrimmed != "start") {
            $txt = "There are only $participantCount participants, you may want to wait till 8 or type \"start\" to confirm /start_popup";
            $telegramAPI->SendPromptMessage($telegramChatId, $txt, $telegramMessageId);
            break;
        }
        
        // Here we have 8 or more participants or user typed "start" to force start with less than 8 participants
        $challonge_response = $challongeAPI->startTournament($popup['id']);

        if ($challongeAPI->hasErrors()) {
            $challongeAPI->listErrors(); //--error starting--
            $txt = "Server Error when trying to start popup";
            $debugOutput = $telegramAPI->SendReplyMessage($telegramChatId, $txt, $telegramMessageId);
            break;
        }

        // here we are free of errors

        $url = $popup['url'];
        $txt = "Popup has now been started, GLHF to all! " .
            "\nTo display results run /popup_results command. " .
            "\nhttp://challonge.com/$url";
        $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt, true, 'HTML');

        break;

    case "/cancel_popup":

         // init challonge
         $challongeAPI = new ChallongeAPI($challonge_token);
         // get all tournaments
         // TODO: get tournamnets for only last 24 hours
         $challongeAPI->GetTournamentsJSON();
 
         // filter for only pending tournaments created by user
         $userPendingTournaments = $challongeAPI->FilterTournamnets(array(
             "creator" => $telegramUserId,
             "state" => "pending"
         ));

        if(count($userPendingTournaments) == 0) {
            $txt = "There is no popup to cancel, you can create one using /new_popup command";
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
            break;
        }

        if(count($userPendingTournaments) > 1) {
            //This is weird case, user can not have more than 1 pending popup
            $txt = "Something gone wrong, multiple pending popups";
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
            break;
        }

        // here we have exactly 1 pending popup for the user
        $popup = $userPendingTournaments[0];
        $popupName = $popup["name"];
        if($telegramTextLowerTrimmed != "cancel") {
            $txt = "/cancel_popup. Are you sure to cancel $popupName, please type \"CANCEL\" to confirm";
            $debugOutput = $telegramAPI->SendPromptMessage($telegramChatId, $txt, $telegramMessageId);
            break;
        }

        // Here usere typed "cancel";
        $challonge_response = $challongeAPI->deleteTournament($popup['id']);
        if ($challongeAPI->hasErrors()) {
            $challongeAPI->listErrors(); //--error starting--
            $txt = "Server Error";
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
            break;
        } 

        // Here we have successfully deleted the tournamnet
        
        $txt = "Popup $popupName has been cancelled and deleted";
        $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
        
        break;

    case "/quit_popup":

        $challongeAPI = new ChallongeAPI($challonge_token);

        // get all tournaments joined by the user
        $challongeAPI->GetMyTournaments($telegramUser["first_name"]);
        $tournamentsByUser = $challongeAPI->FilterTournamnets(array(
            "state" => "pending"
        ));

        if(count($tournamentsByUser) == 0) {
            $txt = "You have not joined any popups to quit from";
            $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
            break;
        }

        $foundByName = false;
        if ($telegramTextLowerTrimmed != "") {
            $t = $challongeAPI->GetTournamentByName($telegramTextLowerTrimmed);
            if ($t) {
                $popup = $t;
                $foundByName = true;
            }
        }
        if ($foundByName == false) {
            $txt = "Please choose from the list of tournaments to /quit_popup: ";
            $buttons = array();
            foreach ($tournamentsByUser as $t) {
                $buttons[] = "/quit_popup " . $t["name"];
            }
            $debugOutput = $telegramAPI->SendPromptWithButtonsInColumn($telegramChatId, $txt, $telegramMessageId, $buttons);
            break;
        }

        //--Only one tournament to quit from--
        $popup = $challongeAPI->GetTournamentByName($telegramTextLowerTrimmed, $tournamentsByUser);
        $popupName = $popup["name"];
        $participantId = $popup['participant_id'];

        $challonge_response = $challongeAPI->deleteParticipant($popup['id'], $participantId);
        $txt = "You have quit popup $popupName";
        $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);

        break;

    case "/kick":
        //TODO: implement
        $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, 'Undefined');
        break;
    case "/opponent":
        //TODO: implement
        // init challonge
        
        $challongeAPI = new ChallongeAPI($challonge_token);
        
        $lastMatch = $challongeAPI->GetMyLastMatch($telegramUser["first_name"]);

        if($lastMatch) {
            $opponent_participant = $challongeAPI->GetOpponentInMatch($lastMatch, $lastMatch["user_participant"]["id"]);
            if($opponent_participant != false)
            {
                $txt = "Your opponent is " . $opponent_participant["name"];
                $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, $txt);
                break;
            }
        }

        $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, 'No opponent');
        break;
    case "/popup_results":
        //TODO: implement
        $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, 'Undefined');
        break;
    case "/report_score":
        
        $challongeAPI = new ChallongeAPI($challonge_token);
        $lastMatch = $challongeAPI->GetMyLastMatch($telegramUser["first_name"]);
        if(!$lastMatch) {
            $txt = "You have no open match";
            $debugOutput = $telegramAPI->SendReplyMessage($telegramChatId, $txt, $telegramMessageId);
            break;
        }

        if($telegramTextLowerTrimmed == "") {
            $txt = "/report_score, please send the score in format: YOURSCORE-OPPONENTSCORE (example: 2-1)";
            $debugOutput = $telegramAPI->SendPromptMessage($telegramChatId, $txt, $telegramMessageId);
            break;
        }

        $wrongFormatMessage = "/report_score, wrong format, please report score in format: YOURSCORE-OPPONENTSCORE (example: 2-1)";
        $scoreTxt = str_replace(" ", "", $telegramTextLowerTrimmed);
        if(strlen($scoreTxt) < 3) {
            $debugOutput = $telegramAPI->SendPromptMessage($telegramChatId, $wrongFormatMessage, $telegramMessageId);
            break;
        }

        $scores = explode(",", $scoreTxt); // if there are more comma separated scores
        $scores = explode("-", $scores[0]);
        if(count($scores) < 2) {
            $debugOutput = $telegramAPI->SendPromptMessage($telegramChatId, $wrongFormatMessage, $telegramMessageId);
            break;
        }
        $userScore = intval($scores[0]);
        $opponentScore = intval($scores[1]);
        if($userScore == 0 &&$opponentScore == 0) {
            $txt = "/report_score, 0-0 is not vaid score, please provide another score";
            $debugOutput = $telegramAPI->SendPromptMessage($telegramChatId, $txt, $telegramMessageId);
            break;
        }

        // Here we have some valid score reported
        $userParticipant = $challongeAPI->GetParticipantByName($telegramUser["first_name"]);
        if(!$userParticipant) {
            // consider to remove this check
            // This is a weird case and should never happen, there MUST be user participant in lastParticipants
            $txt = "Server Error";
            $debugOutput = $telegramAPI->SendReplyMessage($telegramChatId, $txt, $telegramMessageId);
            break;
        }
        if($lastMatch["player1_id"] != $userParticipant["id"]) {
            // if user is not player1 in match (means it is player2)
            // invert scores so the score of the user is second one in array
            $scores = array_reverse($scores);
        }

        // prepare again score in text format
        $scoreTxt = implode("-", $scores);

        $reportParameters = array(
            "match[scores_csv]" => $scoreTxt
        );
        
        $userIsWinner = $userScore > $opponentScore;
        $opponentParticipant = $challongeAPI->GetOpponentInMatch($lastMatch, $userParticipant["id"]);
        if($userIsWinner == false) {
            //it means no confirm is needed, user can directly report own lose
            $reportParameters["match[winner_id]"] = $opponentParticipant["id"];
        }

        $challongeAPI->updateMatch($lastMatch["tournament_id"], $lastMatch["id"], $reportParameters);
        if($challongeAPI->hasErrors() == false) {

            $txt = "Score has been reported! ";
            if($userIsWinner) {
                $txt .= $userParticipant["name"] . " claims to win the match, "
                . $opponentParticipant["name"] . " please /confirm_score";
            } else {
                $txt .= $opponentParticipant["name"] . " won the match";
            }

            $debugOutput = $telegramAPI->SendReplyMessage($telegramChatId, $txt, $telegramMessageId);
            break;
        }

        $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, 'Error reporting score');
        break;
    case "/confirm_score":
        
        $challongeAPI = new ChallongeAPI($challonge_token);
        $lastMatch = $challongeAPI->GetMyLastMatch($telegramUser["first_name"]);
        if(!$lastMatch) {
            $txt = "You have no open match";
            $debugOutput = $telegramAPI->SendReplyMessage($telegramChatId, $txt, $telegramMessageId);
            break;
        }

        $scoreTxt = $lastMatch["scores_csv"];
        if($scoreTxt == "") {
            $txt = "There is no score yet reported for your current match, you can /report_score ";
            $txt .= "in format: YOURSCORE-OPPONENTSCORE (example: 2-1)";
            $debugOutput = $telegramAPI->SendPromptMessage($telegramChatId, $txt, $telegramMessageId);
            break;
        }

        $scores = explode(",", $scoreTxt); // if there are more comma separated scores
        $scores = explode("-", $scores[0]);
        $winnerId = $scores[0] > $scores[1] ? $lastMatch["player1_id"] : $lastMatch["player2_id"];

        $userParticipant = $challongeAPI->GetParticipantByName($telegramUser["first_name"]);
        if($userParticipant["id"] == $winnerId) {
            $txt = "You cannot confirm own win";
            $debugOutput = $telegramAPI->SendReplyMessage($telegramChatId, $txt, $telegramMessageId);
            break;
        }
        
        $challongeAPI->updateMatch($lastMatch["tournament_id"], $lastMatch["id"], array(
            "match[scores_csv]" => $scoreTxt,
            "match[winner_id]" => $winnerId
        ));
        
        $winnerParticipant = $challongeAPI->GetParticipantById($winnerId);
        if($challongeAPI->hasErrors() == false) {

            $txt = "Score has been confirmed! ";
            $txt .= $winnerParticipant["name"] . " won the match";

            //TODO: check tournament status, if it was finals - display appropriate message
            // or display next opponent for the winner

            $debugOutput = $telegramAPI->SendReplyMessage($telegramChatId, $txt, $telegramMessageId);
            break;
        }

        $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, 'Erorr confirm score');
        break;
    case "/start":
        //TODO: implement
        $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, 'Undefined');
        break;
    case "/popups":
        //TODO: implement
        $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, 'Undefined');
        break;
    default:
        $debugOutput = $telegramAPI->SendSimpleMessage($telegramChatId, 'Undefined');
}


header('Content-Type: application/json');
$parsedDebug = json_decode($debugOutput);
echo json_encode($parsedDebug, JSON_PRETTY_PRINT);