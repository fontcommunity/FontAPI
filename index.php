<?php
 header("Access-Control-Allow-Origin: *");

header('Content-Type: application/json; charset=utf-8');

$path = 'test';
if(isset($_GET['path']) && trim($_GET['path'])) {

	$path = $_GET['path'];
}
$cache = '';
if(isset($_GET['cache']) && trim($_GET['cache'])) {
	$cache = "?cache=" . trim($_GET['cache']);
}

$url = 'http://127.0.0.1:8080/' . $path . $cache;


$t = file_get_contents($url);
print $t;

//print '<pre>' . print_R($_REQUEST) . '</pre>';


?>

