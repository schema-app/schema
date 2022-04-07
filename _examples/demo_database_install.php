<?php
    class SchemaDBManager {
    
        private function connect() {
            $serverName = "localhost"; // change to your server
            $username = "username"; // change to your username
            $password = "password"; // change to your password


            $conn = new mysqli($serverName, $username, $password);
            if ($conn->connect_error) {
                die("Connection failed: " . $conn->connect_error);
            } 
            return $conn;
        }

        private function closeDB($conn) {
            $conn->close();
        }

        private function createDB($conn) {
            $sql = "CREATE DATABASE IF NOT EXISTS schema_datastore";
            if ($conn->query($sql) === TRUE) 
                return true;
            return false;
        }

        private function createDataTable($conn) {
            mysqli_select_db($conn,"schema_datastore");

            $sql = "CREATE TABLE IF NOT EXISTS data (
                data_id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                study_id VARCHAR(30) NOT NULL,
                user_id VARCHAR(30) NOT NULL,
                module_index INT(11) NOT NULL,
                module_name VARCHAR(500) NOT NULL,
                responses VARCHAR(10000) NOT NULL,
                response_time VARCHAR(1000) NOT NULL,
                alert_time VARCHAR(1000) NOT NULL,
                platform VARCHAR(50) NOT NULL
            )";
            
            if ($conn->query($sql) === TRUE) 
                return true;
            return false;
        }
        private function writeToDataTable($conn) {
            mysqli_select_db($conn, "schema_datastore");
            print_r($_POST);
            $study_id = $_POST['study_id'];
            $user_id = $_POST['user_id'];
            $module_index = $_POST['module_index'];
            $module_name = $_POST['module_name'];
            $responses = $_POST['responses'];
            $response_time = $_POST['response_time'];
            $alert_time = $_POST['alert_time'];
            $platform = $_POST['platform'];
            
            $sql = "INSERT INTO `data` (`study_id`, `user_id`, `module_index`, `module_name`, `responses`, `response_time`, `alert_time`, `platform`)
                    VALUES ('$study_id', '$user_id', '$module_index', '$module_name', '$responses', '$response_time', '$alert_time', '$platform')";
                     
            if ($conn->query($sql) === TRUE) 
                return true;
            return false;
            
        }        
        private function createLogTable($conn) {
            mysqli_select_db($conn,"schema_datastore");

            $sql = "CREATE TABLE IF NOT EXISTS logs (
                log_id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                study_id VARCHAR(30) NOT NULL,
                user_id VARCHAR(30) NOT NULL,
                module_index INT(11) NOT NULL,
                page VARCHAR(100) NOT NULL,
                timestamp VARCHAR(500) NOT NULL,
                platform VARCHAR(50) NOT NULL
            )";
            
            if ($conn->query($sql) === TRUE) 
                return true;
            return false;
        }    
        private function writeToLogTable($conn) {
            mysqli_select_db($conn, "schema_datastore");
            print_r($_POST);
            $study_id = $_POST['study_id'];
            $user_id = $_POST['user_id'];
            $module_index = $_POST['module_index'];
            $page = $_POST['page'];
            $timestamp = $_POST['timestamp'];
            $platform = $_POST['platform'];
            
            $sql = "INSERT INTO `logs` (`study_id`, `user_id`, `module_index`, `page`, `timestamp`, `platform`)
                    VALUES ('$study_id', '$user_id', '$module_index', '$page', '$timestamp', '$platform')";
                     
            if ($conn->query($sql) === TRUE) 
                return true;
            return false;  
        }
        function setupDB() {
            $conn = $this->connect();

            $db = $this->createDB($conn);
            
            if ($db) {
                echo "Database created successfully";
                $dataTableCreated = $this->createDataTable($conn);
                $insertData = $this->writeToDataTable($conn);
                $logsTableCreated = $this->createLogTable($conn);
                $insertLog = $this->writeToLogTable($conn);
            } else {
                echo "There was an error creating the database";
            }

            if ($dataTableCreated)
                echo "Data table created successfully";
            else
                echo "Error creating data table";

            if ($logsTableCreated) 
                echo "Logs table created successfully";
            else 
                echo "Error creating logs table";
            if ($insertData)
            	echo "Data has been inserted to the table";
            else
                echo "Error inserting data into the table"; 
            if ($insertLog)
                    echo "Logs has been inserted to the table";
                else
                    echo "Error inserting logs into the table";               

            $this->closeDB($conn);
        }
    }

    $dbManager = new SchemaDBManager();
    $dbManager->setupDB();
    

?>
