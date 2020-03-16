<?php
    foreach ($_POST as $key => $value) {
        file_put_contents('data.txt', $key . ':' . $value . '; ', FILE_APPEND);
    } 
    
    file_put_contents('data.txt', "\n", FILE_APPEND);
    
    echo true;
?>
