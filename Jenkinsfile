pipeline {
    agent any

    environment {
        SONAR_HOST_URL = 'http://172.21.42.100:9000'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'local-devsecops',
                    url: 'https://github.com/ErSumit832/ai-Ecommerce-platform.git'
            }
        }

        stage('SonarQube Scan') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'

                    sh """
                    ${scannerHome}/bin/sonar-scanner \
                    -Dsonar.projectKey=ai-ecommerce \
                    -Dsonar.projectName='AI Ecommerce Platform' \
                    -Dsonar.sources=. \
                    -Dsonar.host.url=${SONAR_HOST_URL} \
                    -Dsonar.login=YOUR_SONAR_TOKEN
                    """
                }
            }
        }

        stage('Trivy File Scan') {
            steps {
                sh 'trivy fs . --severity HIGH,CRITICAL'
            }
        }

        stage('Build Backend Image') {
            steps {
                sh 'docker build -t ai-backend:latest ./backend'
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh 'docker build -t ai-frontend:latest ./frontend'
            }
        }

        stage('List Docker Images') {
            steps {
                sh 'docker images'
            }
        }

    }

    post {
        always {
            echo 'Pipeline Completed'
        }

        success {
            echo 'Pipeline Success'
        }

        failure {
            echo 'Pipeline Failed'
        }
    }
}