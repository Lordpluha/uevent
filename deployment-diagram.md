@startuml
scale 1600*900
skinparam shadowing false
skinparam packageStyle rectangle
skinparam linetype ortho
skinparam ArrowColor #475569
skinparam NodeBorderColor #334155
skinparam NodeBackgroundColor #FFFFFF
skinparam DatabaseBorderColor #4F46E5
skinparam DatabaseBackgroundColor #EEF2FF
skinparam CloudBorderColor #0891B2
skinparam CloudBackgroundColor #ECFEFF

title uEvent Deployment Diagram

node "Client Devices" {
  artifact "User Browser" as UserBrowser
  artifact "Admin Browser" as AdminBrowser
}

node "Docker Host (docker-compose)" {
  node "web container\n(apps/web)" as Web
  node "admin container\n(apps/admin)" as Admin
  node "api container\n(apps/api, NestJS)" as Api
  database "postgres container" as Postgres
  folder "storage/uploads\n(events, organizations, users)" as Storage
}

cloud "Stripe API" as Stripe
cloud "SMTP Server" as SMTP
cloud "Google OAuth" as GoogleOAuth

UserBrowser --> Web : HTTPS
AdminBrowser --> Admin : HTTPS

Web --> Api : REST API
Admin --> Api : REST API

Api --> Postgres : TypeORM / SQL
Api --> Storage : read/write media

Api --> Stripe : create PaymentIntent
Stripe --> Api : webhook events

Api --> SMTP : send payment email
Api --> GoogleOAuth : auth callback

note right of Api
Runtime notes:
- API is central integration point
- webhook triggers payment side effects
- reconcile endpoint handles recovery
- email depends on SMTP + user prefs
end note

@enduml
