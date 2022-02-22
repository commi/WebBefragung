<?php

header("Content-Type: text/json");

use PHPMailer\PHPMailer\PHPMailer;

require_once 'vendor/autoload.php';

$post_body = file_get_contents('php://input');

if(empty($post_body))
{
	echo 'empty';
	exit();
}

$data = json_decode($post_body, true);

if(empty($data))
{
	echo 'json_decode';
	exit();
}

print_r($data);

if(is_array($data))
{
	$mailer = new PHPMailer(true);

	$mailer->addAddress("commi.m@gmail.com");

	$mailer->Subject = 'WebBefragung';
	$mailer->Body    = json_encode($data, JSON_PRETTY_PRINT);

	$mailer->send();
}