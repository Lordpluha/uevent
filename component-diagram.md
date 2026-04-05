@startuml
left to right direction
scale 1600*900
skinparam shadowing false
skinparam componentStyle rectangle
skinparam packageStyle rectangle
skinparam linetype ortho
skinparam nodesep 20
skinparam ranksep 40
skinparam ArrowColor #475569
skinparam ComponentBorderColor #334155
skinparam ComponentBackgroundColor #FFFFFF
skinparam PackageBorderColor #CBD5E1
skinparam PackageBackgroundColor #F8FAFC

title uEvent Component Diagram

actor "User Browser" as UserBrowser
actor "Admin Browser" as AdminBrowser

package "Frontend" {
  component "Web App\n(React Router)" as WebApp
  component "Admin App\n(React)" as AdminApp
  component "Shared UI / API Client\n(entities, features, widgets)" as SharedFE
}

package "Backend (NestJS API)" {
  component "Auth Module" as AuthModule
  component "Events Module" as EventsModule
  component "Organizations Module" as OrgsModule
  component "Payments Module" as PaymentsModule
  component "Notifications Module" as NotifModule
  component "Users Module" as UsersModule
  component "Tickets Module" as TicketsModule
  component "Tags Module" as TagsModule
  component "Files Module" as FilesModule
}

database "PostgreSQL" as Postgres
collections "Storage / Uploads" as Storage
cloud "Stripe API" as Stripe
cloud "SMTP Server" as SMTP
cloud "Google OAuth" as GoogleOAuth

UserBrowser --> WebApp : HTTPS
AdminBrowser --> AdminApp : HTTPS

WebApp --> SharedFE
AdminApp --> SharedFE

WebApp --> AuthModule : REST
WebApp --> EventsModule : REST
WebApp --> PaymentsModule : REST
WebApp --> NotifModule : REST
WebApp --> UsersModule : REST

AdminApp --> AuthModule : REST
AdminApp --> EventsModule : REST
AdminApp --> PaymentsModule : REST
AdminApp --> UsersModule : REST
AdminApp --> OrgsModule : REST

EventsModule --> OrgsModule : organizer data
EventsModule --> TagsModule : event tags
EventsModule --> NotifModule : follower alerts
PaymentsModule --> TicketsModule : issue tickets
PaymentsModule --> NotifModule : in-app notifications
PaymentsModule --> UsersModule : email preferences

AuthModule --> Postgres
EventsModule --> Postgres
OrgsModule --> Postgres
PaymentsModule --> Postgres
NotifModule --> Postgres
UsersModule --> Postgres
TicketsModule --> Postgres
TagsModule --> Postgres
FilesModule --> Storage

PaymentsModule --> Stripe : create PaymentIntent
Stripe --> PaymentsModule : webhook events
PaymentsModule --> SMTP : send payment email
AuthModule --> GoogleOAuth : login callback

note right of PaymentsModule
Payment success flow:
- apply side effects
- issue purchased tickets
- notify in-app
- optional SMTP email
- reconcile endpoint for recovery
end note
@enduml