from graphviz import Digraph

# Create a directed graph
dot = Digraph(comment="AI Recovery Trainer Workflow", format="png")
dot.attr(rankdir="TB", size="8")

# Define nodes
dot.node("L", "Landing Page")
dot.node("LS", "Login / Signup")
dot.node("P", "Personal Info Form\n(Name, Age, Gender, Surgery, Restrictions)")
dot.node("AI", "AI Module\n- Recovery Plan\n- Meal Plan\n- Medicine Schedule")
dot.node("D", "Dashboard / Home")

# Dashboard features
dot.node("R", "Recovery Plan\n(Week-wise Timeline)")
dot.node("M", "Meal Plan")
dot.node("MT", "Medicine Tracker\n+ Alerts")
dot.node("C", "Daily Check-in\n(Pain, Mobility, Exercise)")
dot.node("PR", "Progress Tracker\n(Graphs & Reports)")
dot.node("A", "AI Assistant Chat\n(optional)")

# Define edges (flow)
dot.edges([("L", "LS"), ("LS", "P"), ("P", "AI"), ("AI", "D")])

# Dashboard connections
dot.edges([("D", "R"), ("D", "M"), ("D", "MT"), ("D", "C"), ("D", "PR"), ("D", "A")])

# Render the diagram
dot.render("ai_recovery_trainer_workflow", view=True)
