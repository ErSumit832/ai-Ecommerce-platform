pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                echo 'Repository checkout successful'
            }
        }

        stage('Workspace') {
            steps {
                sh 'pwd'
                sh 'ls -la'
            }
        }

    }
}