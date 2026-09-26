pipeline {
    agent any

    environment {
        SONAR_HOST_URL = "http://172.21.42.100:9000"

        BACKEND_IMAGE = "sumitkdevops/ai-backend"
        FRONTEND_IMAGE = "sumitkdevops/ai-frontend"

        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(
            numToKeepStr: '10'
        ))
    }

    stages {

        stage('Clean Workspace') {
            steps {
                deleteDir()
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Workspace Validation') {
            steps {
                sh '''
                    pwd
                    ls -la
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {

                    def scannerHome = tool 'sonar-scanner'

                    withCredentials([
                        string(
                            credentialsId: 'sonar-token',
                            variable: 'SONAR_TOKEN'
                        )
                    ]) {

                        sh """
                        ${scannerHome}/bin/sonar-scanner \
                        -Dsonar.projectKey=ai-ecommerce \
                        -Dsonar.projectName="AI Ecommerce Platform" \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=${SONAR_HOST_URL} \
                        -Dsonar.login=$SONAR_TOKEN
                        """
                    }
                }
            }
        }

        stage('Trivy Filesystem Scan') {
            steps {
                sh '''
                trivy fs . \
                --severity HIGH,CRITICAL \
                --no-progress
                '''
            }
        }

        stage('Build Backend Image') {
            steps {
                sh """
                docker build \
                -t ${BACKEND_IMAGE}:${IMAGE_TAG} \
                ./backend
                """
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh """
                docker build \
                -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                ./frontend
                """
            }
        }

        stage('Trivy Backend Image Scan') {
            steps {
                sh """
                trivy image \
                ${BACKEND_IMAGE}:${IMAGE_TAG}
                """
            }
        }

        stage('Trivy Frontend Image Scan') {
            steps {
                sh """
                trivy image \
                ${FRONTEND_IMAGE}:${IMAGE_TAG}
                """
            }
        }

        
        stage('Push Docker Images') {

            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {

                    sh '''
                    echo $DOCKER_PASS | docker login \
                    -u $DOCKER_USER \
                    --password-stdin

                    docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                    docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                    '''
                }
            }
        }
        

        
        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                kubectl apply -f k8s/
                '''
            }
        }
        
    }

    post {

        success {
            echo 'Pipeline completed successfully'
        }

        failure {
            echo 'Pipeline failed'
        }

        always {
            sh 'docker images | head'
        }
    }
}