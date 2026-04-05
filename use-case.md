@startuml
left to right direction
skinparam shadowing false
skinparam actorStyle awesome
skinparam nodesep 35
skinparam ranksep 40

skinparam usecase {
  BackgroundColor #FFFFFF
  BorderColor #334155
  ArrowColor #475569
  FontColor #1E293B
}

skinparam rectangle {
  BackgroundColor #F8FAFC
  BorderColor #CBD5E1
  FontColor #1E293B
}

actor Guest
actor User
actor Organizer
actor Admin

rectangle "Guest & User Functions" {
  usecase "Browse events" as UC_BROWSE
  usecase "View event details" as UC_VIEW_EVENT
  usecase "Register / Login\n(Google OAuth)" as UC_AUTH
  usecase "Subscribe to event" as UC_SUB_EVENT
  usecase "Follow organizer" as UC_FOLLOW_ORG
  usecase "Buy ticket" as UC_BUY
  usecase "Download ticket PDF" as UC_PDF
  usecase "View notifications" as UC_NOTIFS
  usecase "Receive organizer alerts" as UC_ALERTS
  usecase "Get payment email" as UC_EMAIL
}

rectangle "Organizer Functions" {
  usecase "Create event" as UC_CREATE_EVENT
  usecase "Manage tickets / sales" as UC_MANAGE_TICKETS
  usecase "Edit organization" as UC_MANAGE_ORG
  usecase "Submit verification" as UC_VERIFY
  usecase "Request withdrawal" as UC_WITHDRAW
}

rectangle "Admin Functions" {
  usecase "Admin dashboard" as UC_ADMIN
  usecase "Moderate content" as UC_MODERATE
  usecase "Review finances" as UC_FIN_REVIEW
}


' Guest interactions
Guest --> UC_BROWSE
Guest --> UC_VIEW_EVENT
Guest --> UC_AUTH

' User interactions
User --> UC_BROWSE
User --> UC_VIEW_EVENT
User --> UC_AUTH
User --> UC_SUB_EVENT
User --> UC_FOLLOW_ORG
User --> UC_BUY
User --> UC_PDF
User --> UC_NOTIFS

' Organizer interactions
Organizer --> UC_AUTH
Organizer --> UC_CREATE_EVENT
Organizer --> UC_MANAGE_TICKETS
Organizer --> UC_MANAGE_ORG
Organizer --> UC_VERIFY
Organizer --> UC_WITHDRAW

' Admin interactions
Admin --> UC_AUTH
Admin --> UC_ADMIN
Admin --> UC_MODERATE
Admin --> UC_FIN_REVIEW

' Relationships
UC_BUY .> UC_EMAIL : <<extends>>
UC_BUY .> UC_PDF : <<includes>>
UC_FOLLOW_ORG .> UC_ALERTS : <<triggers>>
UC_ADMIN .> UC_MODERATE : <<includes>>
UC_ADMIN .> UC_FIN_REVIEW : <<includes>>

note right of UC_EMAIL
  Best-effort delivery
  (SMTP + user preference)
end note

note right of UC_ALERTS
  Organizer publishes new event
end note
@enduml