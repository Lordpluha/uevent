@startuml
left to right direction
skinparam shadowing false
skinparam packageStyle rectangle
skinparam actorStyle awesome
skinparam usecase {
  BackgroundColor #FFFFFF
  BorderColor #334155
  ArrowColor #475569
}

actor Guest
actor User
actor Organizer
actor Admin

rectangle "uEvent System" {
  usecase "Browse events" as UC_BROWSE
  usecase "View event details" as UC_VIEW_EVENT
  usecase "Register / Login\n(including Google OAuth)" as UC_AUTH

  usecase "Subscribe to event" as UC_SUB_EVENT
  usecase "Follow / unfollow organizer" as UC_FOLLOW_ORG
  usecase "Buy ticket" as UC_BUY
  usecase "View in-app notifications" as UC_NOTIFS
  usecase "Get payment email\n(optional)" as UC_EMAIL
  usecase "Download ticket PDF" as UC_PDF

  usecase "Create event" as UC_CREATE_EVENT
  usecase "Manage tickets / sales" as UC_MANAGE_TICKETS
  usecase "Manage organization profile" as UC_MANAGE_ORG
  usecase "Submit verification" as UC_VERIFY
  usecase "Create withdrawal request" as UC_WITHDRAW

  usecase "Admin panel" as UC_ADMIN
  usecase "Moderate users/events" as UC_MODERATE
  usecase "Review verification / withdrawals" as UC_FIN_REVIEW

  usecase "Receive new-event alerts\nfrom followed organizations" as UC_ALERTS
}

Guest --> UC_BROWSE
Guest --> UC_VIEW_EVENT
Guest --> UC_AUTH

User --> UC_BROWSE
User --> UC_VIEW_EVENT
User --> UC_SUB_EVENT
User --> UC_FOLLOW_ORG
User --> UC_BUY
User --> UC_NOTIFS
User --> UC_PDF
User --> UC_AUTH

Organizer --> UC_AUTH
Organizer --> UC_CREATE_EVENT
Organizer --> UC_MANAGE_TICKETS
Organizer --> UC_MANAGE_ORG
Organizer --> UC_VERIFY
Organizer --> UC_WITHDRAW

Admin --> UC_AUTH
Admin --> UC_ADMIN
Admin --> UC_MODERATE
Admin --> UC_FIN_REVIEW

UC_BUY .> UC_EMAIL : <<extend>>
UC_FOLLOW_ORG .> UC_ALERTS : <<include>>
UC_BUY .> UC_PDF : <<include>>
UC_ADMIN .> UC_MODERATE : <<include>>
UC_ADMIN .> UC_FIN_REVIEW : <<include>>

note right of UC_EMAIL
Best-effort delivery:
SMTP config + user preference flags.
end note

note right of UC_ALERTS
Triggered when organizer publishes new event.
end note
@enduml