@startuml
scale 1600*900
hide circle
skinparam shadowing false
skinparam linetype ortho
skinparam ArrowColor #475569
skinparam class {
  BackgroundColor #FFFFFF
  BorderColor #334155
  FontColor #0f172a
}

title uEvent Database Diagram (ER)

entity "users" as users {
  * id : uuid
  --
  email : string
  username : string
  first_name : string
  last_name : string
  notifications_enabled : boolean
  subscription_notifications_enabled : boolean
  payment_email_enabled : boolean
}

entity "organizations" as organizations {
  * id : uuid
  --
  name : string
  email : string
  description : text
  avatar : string
  cover : string
}

entity "events" as events {
  * id : uuid
  --
  organization_id : uuid
  name : string
  description : text
  format : enum
  datetime_start : datetime
  datetime_end : datetime
  location : string
  attendees_public : boolean
}

entity "tickets" as tickets {
  * id : uuid
  --
  event_id : uuid
  user_id : uuid?
  name : string
  status : enum
  price : decimal
  private_info : text
}

entity "payments" as payments {
  * id : uuid
  --
  stripe_payment_intent_id : string
  user_id : uuid?
  amount : decimal
  currency : string
  status : enum
  metadata : json
}

entity "notifications" as notifications {
  * id : uuid
  --
  user_id : uuid?
  organization_id : uuid?
  name : string
  content : text
  link : string
  read : boolean
}

entity "event_subscriptions" as event_subscriptions {
  * id : uuid
  --
  event_id : uuid
  user_id : uuid
}

entity "organization_followers" as organization_followers {
  * organization_id : uuid
  * user_id : uuid
}

entity "tags" as tags {
  * id : uuid
  --
  name : string
}

entity "event_tags" as event_tags {
  * event_id : uuid
  * tag_id : uuid
}

entity "promo_codes" as promo_codes {
  * id : uuid
  --
  event_id : uuid
  code : string
  discount_percent : int
  usage_limit : int
  usage_count : int
}

entity "organization_transactions" as organization_transactions {
  * id : uuid
  --
  organization_id : uuid
  type : enum
  amount : decimal
  source_payment_intent_id : string?
  source_withdrawal_request_id : uuid?
}

entity "organization_verifications" as organization_verifications {
  * id : uuid
  --
  organization_id : uuid
  status : enum
  admin_comment : text?
}

entity "organization_withdrawal_requests" as organization_withdrawal_requests {
  * id : uuid
  --
  organization_id : uuid
  amount : decimal
  status : enum
  admin_comment : text?
}

organizations ||--o{ events : owns
events ||--o{ tickets : has
users ||--o{ tickets : buys
users ||--o{ event_subscriptions : subscribes
events ||--o{ event_subscriptions : subscribed

users ||--o{ organization_followers : follows
organizations ||--o{ organization_followers : followed_by

events ||--o{ event_tags : categorized
tags ||--o{ event_tags : tag

events ||--o{ promo_codes : has

users ||--o{ notifications : receives
organizations ||--o{ notifications : receives

organizations ||--o{ organization_transactions : ledger
organizations ||--|| organization_verifications : verification
organizations ||--o{ organization_withdrawal_requests : withdrawals

@enduml
