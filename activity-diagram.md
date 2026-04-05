@startuml
skinparam shadowing false
skinparam activity {
  BackgroundColor #FFFFFF
  BorderColor #334155
  ArrowColor #475569
  FontColor #0f172a
}

title uEvent Activity Diagram

start

partition "User (Web App)" {
  :Open Events page;
}

partition "API (NestJS)" {
  :Fetch events list;
}

partition "User (Web App)" {
  :View event details;
}

partition "API (NestJS)" {
  :Fetch event + organizer;
}

partition "User (Web App)" {
  if (Subscribe to event?) then (yes)
    :Click Subscribe;
    partition "API (NestJS)" {
      :Save event subscription;
    }
  else (skip)
  endif

  if (Follow organizer?) then (yes)
    :Click Follow;
    partition "API (NestJS)" {
      :Save follow relation;
    }
  else (no)
  endif
}

partition "API (NestJS)" {
  :When organizer publishes event\nnotify followed users;
}

partition "User (Web App)" {
  if (Buy ticket?) then (yes)
    :Enter card data and confirm;
  else (no)
    :Open notifications (bell/profile);
    stop
  endif
}

partition "API (NestJS)" {
  :Create PaymentIntent;
}

partition "External (Stripe)" {
  :Confirm payment;
}

partition "API (NestJS)" {
  if (Payment succeeded?) then (yes)
    :Apply side-effects\n(sale/promo/stock);
    :Issue purchased tickets;
    :Create in-app notifications;

    if (SMTP configured and\nuser allows payment email?) then (yes)
      partition "External (SMTP)" {
        :Send payment email;
      }
    else (no)
    endif

    partition "User (Web App)" {
      :Open success page;
      :Optionally call reconcile\nfor recovery;
      :Download ticket PDF;
      :Open notifications;
    }
    stop
  else (no)
    partition "User (Web App)" {
      :Show payment processing/failed state;
    }
    stop
  endif
}
@enduml