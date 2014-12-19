 <?php
 header('Access-Control-Allow-Origin: *');  
 
 require_once('config.php');
 require_once('database.php');

$request_body = file_get_contents('php://input');
$data = json_decode($request_body);

$db = new Database(
    $cfg['db']['host'],
    $cfg['db']['dbase'],
    $cfg['db']['user'],
    $cfg['db']['pass']
);

$parms = new QueryParameters();
$parms->addParameter(':broadcastSongID',$data->history->broadcastSongID);
$parms->addParameter(':userID',$data->userID);
$parms->addParameter(':songName',$data->songName);
$parms->addParameter(':songID',$data->songID);
$parms->addParameter(':songName',$data->songName);
$parms->addParameter(':artistID',$data->artistID);
$parms->addParameter(':artistName',$data->artistName);
$parms->addParameter(':albumID',$data->albumID);
$parms->addParameter(':albumName',$data->albumName);
$parms->addParameter(':votes',count($data->history->upVotes)-count($data->history->downVotes));
$parms->addParameter(':upVotes',count($data->history->upVotes));
$parms->addParameter(':downVotes',count($data->history->downVotes));
$parms->addParameter(':listens',$data->history->listens);
$parms->addParameter(':estimateDuration',$data->estimateDuration);

$query = "INSERT INTO  songHistory (broadcastSongID, userID, songID,
            songName, artistID, artistName, albumID, albumName, votes, upVotes, downVotes,
            listens, estimateDuration)
        VALUES (:broadcastSongID,  :userID, :songID, 
            :songName, :artistID, :artistName, :albumID, :albumName, :votes, :upVotes, :downVotes, 
            :listens, :estimateDuration)
        ON DUPLICATE KEY UPDATE votes=:votes, upVotes=:upVotes, downVotes=:downVotes;";

try
{
    $result = $db->execute($query, $parms);
}
catch (Exception $e) 
{
    print_r($e->getMessage());
}        
        
//echo "data captured for '{$data->songName} - {$data->artistName}'";
