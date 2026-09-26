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

        buildDiscarder(
            logRotator(
                numToKeepStr: '20'
            )
        )
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
                        -Dsonar.projectName='AI Ecommerce Platform' \
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
                --severity HIGH,CRITICAL \
                --no-progress \
                ${BACKEND_IMAGE}:${IMAGE_TAG}
                """
            }
        }

        stage('Trivy Frontend Image Scan') {
            steps {
                sh """
                trivy image \
                --severity HIGH,CRITICAL \
                --no-progress \
                ${FRONTEND_IMAGE}:${IMAGE_TAG}
                """
            }
        }

        stage('Docker Hub Login') {
            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {

                    sh '''
                    echo "$DOCKER_PASS" | docker login \
                    -u "$DOCKER_USER" \
                    --password-stdin
                    '''
                }
            }
        }

        stage('Push Docker Images') {
            steps {

                sh """
                docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                """

            }
        }

        
        stage('Deploy Namespace') {
            steps {
               sh 'kubectl apply -f k8s/namespace.yml'
            }
        }

        stage('Deploy Application') {
            steps {
               sh '''
               sleep 5
                 kubectl apply -f k8s/postgres-deployment.yaml
                  kubectl apply -f k8s/postgres-service.yaml
                  kubectl apply -f k8s/backend-deployment.yaml
                  kubectl apply -f k8s/backend-service.yaml
                  kubectl apply -f k8s/frontend-deployment.yaml
                  kubectl apply -f k8s/frontend-service.yaml
                 '''
            }
        }
        

    }

    post {

        success {
            echo '✅ Pipeline completed successfully'
        }

        failure {
            echo '❌ Pipeline failed'
        }

        always {

            sh '''
            docker image ls | head
            '''

            cleanWs()
        }
    }
}